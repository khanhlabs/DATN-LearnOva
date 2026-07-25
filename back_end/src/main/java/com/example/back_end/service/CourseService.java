package com.example.back_end.service;

import com.example.back_end.dto.response.CourseDetailResponse;
import com.example.back_end.dto.response.FeaturedCourseResponse;
import com.example.back_end.dto.response.PublicCourseResponse;
import com.example.back_end.dto.response.TeacherCoursesResponse;
import com.example.back_end.dto.response.TeacherReviewResponse;
import com.example.back_end.dto.response.TeacherStudentResponse;
import com.example.back_end.dto.response.TopCategoryResponse;
import com.example.back_end.entity.Enrollment;
import com.example.back_end.dto.resquest.CreateDraftCourseRequest;
import com.example.back_end.dto.resquest.UpdateCourseRequest;
import com.example.back_end.entity.Category;
import com.example.back_end.entity.Course;
import com.example.back_end.entity.Coursecategory;
import com.example.back_end.entity.CoursecategoryId;
import com.example.back_end.entity.User;
import com.example.back_end.entity.enums.CourseStatus;
import com.example.back_end.entity.enums.NotificationType;
import com.example.back_end.exception.BusinessException;
import com.example.back_end.exception.ResourceNotFoundException;
import com.example.back_end.repository.CourseRepository;
import com.example.back_end.repository.CoursecategoryRepository;
import com.example.back_end.entity.Lesson;
import com.example.back_end.entity.enums.HlsStatus;
import com.example.back_end.repository.EnrollmentRepository;
import com.example.back_end.repository.LessonRepository;
import com.example.back_end.repository.PromotioncourseRepository;
import com.example.back_end.repository.ReviewRepository;
import com.example.back_end.repository.UserRepository;
import com.example.back_end.repository.InstructorProfileRepository;
import com.example.back_end.repository.admin.AdminCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CourseService {

        private final CourseRepository courseRepository;
        private final UserRepository userRepository;
        private final CoursecategoryRepository coursecategoryRepository;
        private final AdminCategoryRepository categoryRepository;
        private final EnrollmentRepository enrollmentRepository;
        private final PromotioncourseRepository promotioncourseRepository;
        private final ReviewRepository reviewRepository;
        private final LessonRepository lessonRepository;
        private final NotificationService notificationService;
        private final InstructorProfileRepository instructorProfileRepository;
        private final S3Service s3Service;

        private static final Set<CourseStatus> TEACHER_SETTABLE_STATUSES = EnumSet.of(CourseStatus.DRAFT,
                        CourseStatus.PENDING_REVIEW);

        public Long createDraftCourse(CreateDraftCourseRequest request, String email) {
                User instructor = userRepository
                                .findByEmailAndIsDeletedFalse(email)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                Course course = new Course();

                course.setTitle(request.title());
                course.setDescription(request.description());
                course.setLanguage(request.language());
                course.setLevel(request.level());
                course.setBasePrice(request.basePrice());
                course.setRequirements(request.requirements());
                course.setWhatYouLearn(request.whatYouLearn());
                course.setThumbnailKey(request.thumbnailKey());
                course.setStatus(CourseStatus.DRAFT);
                course.setInstructor(instructor);
                course.setIsDeleted(false);
                course.setSlug(UUID.randomUUID().toString());
                course.setCreatedAt(Instant.now());
                course.setUpdatedAt(Instant.now());

                courseRepository.save(course);

                if (request.categoryId() != null) {
                        Category category = categoryRepository.findActiveById(request.categoryId())
                                        .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

                        CoursecategoryId ccId = new CoursecategoryId();
                        ccId.setCourseId(course.getId());
                        ccId.setCategoryId(category.getId());

                        Coursecategory cc = new Coursecategory();
                        cc.setId(ccId);
                        cc.setCourse(course);
                        cc.setCategory(category);
                        cc.setIsPrimary(true);

                        coursecategoryRepository.save(cc);
                }

                return course.getId();
        }

        public void updateCourseStatus(Long courseId, String email, String status) {
                User instructor = userRepository
                                .findByEmailAndIsDeletedFalse(email)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                Course course = courseRepository.findById(courseId)
                                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));

                if (!course.getInstructor().getId().equals(instructor.getId())) {
                        throw new BusinessException("You don't have permission to modify this course");
                }

                CourseStatus newStatus;
                try {
                        newStatus = CourseStatus.valueOf(status.toUpperCase());
                } catch (IllegalArgumentException e) {
                        throw new BusinessException("Invalid course status: " + status);
                }

                if (!TEACHER_SETTABLE_STATUSES.contains(newStatus)) {
                        throw new BusinessException(
                                        "You can only save as draft or submit for review. Publishing requires admin approval.");
                }

                course.setStatus(newStatus);
                course.setUpdatedAt(Instant.now());

                if (newStatus == CourseStatus.PENDING_REVIEW) {
                        course.setRejectionReason(null);
                        notificationService.createForAll(
                                        userRepository.findAllAdmins(),
                                        NotificationType.COURSE_SUBMITTED,
                                        "New course submitted for review",
                                        course.getInstructor().getFullName() + " submitted \"" + course.getTitle()
                                                        + "\" for review.",
                                        "/learnova/admin/course-approval/" + course.getId(),
                                        Map.of("courseId", course.getId(), "courseTitle", course.getTitle()));
                }

                courseRepository.save(course);
        }

        public List<TeacherCoursesResponse> getMyCourses(String email) {
                User instructor = userRepository
                                .findByEmailAndIsDeletedFalse(email)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                List<Course> courses = courseRepository
                                .findByInstructorIdOrderByCreatedAtDesc(instructor.getId());

                List<Long> courseIds = courses.stream()
                                .map(Course::getId)
                                .toList();

                Map<Long, Long> enrollmentCountByCourseId = courseIds.isEmpty()
                                ? Map.of()
                                : enrollmentRepository.findByCourseIdIn(courseIds)
                                                .stream()
                                                .collect(Collectors.groupingBy(e -> e.getCourse().getId(),
                                                                Collectors.counting()));

                Map<Long, ReviewRepository.CourseRatingProjection> ratingByCourseId = reviewRepository
                                .findAvgRatingByCourseForInstructor(instructor.getId())
                                .stream()
                                .collect(Collectors.toMap(ReviewRepository.CourseRatingProjection::getCourseId,
                                                r -> r));

                return courses.stream()
                                .map(course -> {
                                        String categoryName = course.getCoursecategories().stream()
                                                        .filter(cc -> Boolean.TRUE.equals(cc.getIsPrimary()))
                                                        .findFirst()
                                                        .map(cc -> cc.getCategory().getName())
                                                        .orElse(null);

                                        var activeLessons = course.getSections().stream()
                                                        .filter(s -> !Boolean.TRUE.equals(s.getIsDeleted()))
                                                        .flatMap(s -> s.getLessons().stream())
                                                        .filter(l -> !Boolean.TRUE.equals(l.getIsDeleted()))
                                                        .toList();

                                        long lessonCount = activeLessons.size();

                                        long totalDurationSeconds = activeLessons.stream()
                                                        .mapToLong(l -> l.getDurationSeconds() != null
                                                                        ? l.getDurationSeconds()
                                                                        : 0)
                                                        .sum();

                                        long studentCount = enrollmentCountByCourseId.getOrDefault(course.getId(), 0L);

                                        ReviewRepository.CourseRatingProjection rating = ratingByCourseId
                                                        .get(course.getId());
                                        double avgRating = rating != null && rating.getAvgRating() != null
                                                        ? rating.getAvgRating()
                                                        : 0;
                                        long ratingCount = rating != null && rating.getRatingCount() != null
                                                        ? rating.getRatingCount()
                                                        : 0;

                                        return new TeacherCoursesResponse(
                                                        course.getId(),
                                                        course.getTitle(),
                                                        course.getThumbnailKey(),
                                                        course.getStatus(),
                                                        course.getBasePrice(),
                                                        course.getCreatedAt(),
                                                        course.getUpdatedAt(),
                                                        categoryName,
                                                        lessonCount,
                                                        totalDurationSeconds,
                                                        studentCount,
                                                        course.getIsDeleted(),
                                                        course.getRejectionReason(),
                                                        avgRating,
                                                        ratingCount);
                                })
                                .toList();
        }

        @Transactional(readOnly = true)
        public CourseDetailResponse getCourseDetail(Long courseId) {
                Course course = courseRepository.findCourseDetailById(courseId)
                                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));

                var primaryCategory = course.getCoursecategories().stream()
                                .filter(cc -> Boolean.TRUE.equals(cc.getIsPrimary()))
                                .findFirst()
                                .orElse(null);

                String categoryName = primaryCategory != null ? primaryCategory.getCategory().getName() : null;
                Long categoryId = primaryCategory != null ? primaryCategory.getCategory().getId() : null;

                List<CourseDetailResponse.SectionInfo> sections = course.getSections().stream()
                                .filter(s -> !Boolean.TRUE.equals(s.getIsDeleted()))
                                .sorted(Comparator.comparingDouble(
                                                s -> s.getSectionOrder() != null ? s.getSectionOrder() : 0.0))
                                .map(s -> {
                                        List<CourseDetailResponse.LessonInfo> lessons = s.getLessons().stream()
                                                        .filter(l -> !Boolean.TRUE.equals(l.getIsDeleted()))
                                                        .sorted(Comparator
                                                                        .comparingDouble(l -> l.getLessonOrder() != null
                                                                                        ? l.getLessonOrder()
                                                                                        : 0.0))
                                                        .map(l -> new CourseDetailResponse.LessonInfo(
                                                                        l.getId(),
                                                                        l.getTitle(),
                                                                        l.getLessonOrder(),
                                                                        l.getDurationSeconds(),
                                                                        l.getVideoKey(),
                                                                        l.getIsPreview()))
                                                        .toList();

                                        return new CourseDetailResponse.SectionInfo(
                                                        s.getId(),
                                                        s.getTitle(),
                                                        s.getSectionOrder(),
                                                        lessons);
                                })
                                .toList();

                long lessonCount = sections.stream()
                                .mapToLong(s -> s.lessons().size())
                                .sum();

                long totalDurationSeconds = sections.stream()
                                .flatMap(s -> s.lessons().stream())
                                .mapToLong(l -> l.durationSeconds() != null ? l.durationSeconds() : 0)
                                .sum();

                User instructor = course.getInstructor();

                String instructorDescription = instructorProfileRepository.findById(instructor.getId())
                                .map(profile -> profile.getDescription())
                                .orElse(null);

                CourseDetailResponse.InstructorInfo instructorInfo = new CourseDetailResponse.InstructorInfo(
                                instructor.getId(),
                                instructor.getFullName(),
                                s3Service.resolveAvatarUrl(instructor.getAvatar()),
                                instructorDescription);

                return new CourseDetailResponse(
                                course.getId(),
                                course.getTitle(),
                                course.getDescription(),
                                course.getThumbnailKey(),
                                course.getBasePrice(),
                                course.getLevel(),
                                course.getLanguage(),
                                course.getRequirements(),
                                course.getWhatYouLearn(),
                                categoryName,
                                categoryId,
                                lessonCount,
                                totalDurationSeconds,
                                instructorInfo,
                                sections);
        }

        public void updateCourse(Long courseId, UpdateCourseRequest request, String email) {
                User instructor = userRepository
                                .findByEmailAndIsDeletedFalse(email)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                Course course = courseRepository.findById(courseId)
                                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));

                if (!course.getInstructor().getId().equals(instructor.getId())) {
                        throw new BusinessException("You don't have permission to modify this course");
                }

                course.setTitle(request.title());
                course.setDescription(request.description());
                course.setLanguage(request.language());
                course.setLevel(request.level());
                course.setBasePrice(request.basePrice());
                course.setThumbnailKey(request.thumbnailKey());
                course.setRequirements(request.requirements());
                course.setWhatYouLearn(request.whatYouLearn());
                course.setUpdatedAt(Instant.now());
                courseRepository.save(course);

                if (request.categoryId() != null) {
                        coursecategoryRepository.deleteByCourseId(courseId);

                        Category category = categoryRepository.findActiveById(request.categoryId())
                                        .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

                        CoursecategoryId ccId = new CoursecategoryId();
                        ccId.setCourseId(courseId);
                        ccId.setCategoryId(category.getId());

                        Coursecategory cc = new Coursecategory();
                        cc.setId(ccId);
                        cc.setCourse(course);
                        cc.setCategory(category);
                        cc.setIsPrimary(true);

                        coursecategoryRepository.save(cc);
                }
        }

        public void softDeleteCourse(Long courseId, String email) {
                User instructor = userRepository
                                .findByEmailAndIsDeletedFalse(email)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                Course course = courseRepository.findById(courseId)
                                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));

                if (!course.getInstructor().getId().equals(instructor.getId())) {
                        throw new BusinessException("You don't have permission to delete this course");
                }

                course.setIsDeleted(true);
                course.setUpdatedAt(Instant.now());
                courseRepository.save(course);
        }

        public boolean toggleCourseVisibility(Long courseId, String email) {
                User instructor = userRepository
                                .findByEmailAndIsDeletedFalse(email)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                Course course = courseRepository.findById(courseId)
                                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));

                if (!course.getInstructor().getId().equals(instructor.getId())) {
                        throw new BusinessException("You don't have permission to modify this course");
                }

                boolean newState = !Boolean.TRUE.equals(course.getIsDeleted());
                course.setIsDeleted(newState);
                course.setUpdatedAt(Instant.now());
                courseRepository.save(course);
                return newState;
        }

        @Transactional(readOnly = true)
        public List<FeaturedCourseResponse> getFeaturedCourses() {
                List<Course> published = courseRepository.findAllByStatus(CourseStatus.PUBLISHED);

                List<Long> courseIds = published.stream()
                                .map(Course::getId)
                                .toList();

                Map<Long, Long> enrollmentCountByCourseId = courseIds.isEmpty()
                                ? Map.of()
                                : enrollmentRepository.findByCourseIdIn(courseIds)
                                                .stream()
                                                .collect(Collectors.groupingBy(e -> e.getCourse().getId(),
                                                                Collectors.counting()));

                List<Course> top8 = published.stream()
                                .sorted((a, b) -> Long.compare(
                                                enrollmentCountByCourseId.getOrDefault(b.getId(), 0L),
                                                enrollmentCountByCourseId.getOrDefault(a.getId(), 0L)))
                                .limit(8)
                                .toList();

                Instant now = Instant.now();
                List<Long> top8Ids = top8.stream().map(Course::getId).toList();
                Map<Long, Integer> discountByCourseId = top8Ids.isEmpty()
                                ? Map.of()
                                : promotioncourseRepository.findActivePromotionsByCourseIds(top8Ids, now)
                                                .stream()
                                                .collect(Collectors.toMap(
                                                                pc -> pc.getCourse().getId(),
                                                                pc -> pc.getPromotion().getDiscountPercent(),
                                                                (a, b) -> a));

                Map<Long, ReviewRepository.CourseRatingProjection> ratingByCourseId = top8Ids.isEmpty()
                                ? Map.of()
                                : reviewRepository.findAvgRatingByCourseIds(top8Ids)
                                                .stream()
                                                .collect(Collectors.toMap(
                                                                ReviewRepository.CourseRatingProjection::getCourseId,
                                                                r -> r));

                return top8.stream()
                                .map(course -> {
                                        String categoryName = course.getCoursecategories().stream()
                                                        .filter(cc -> Boolean.TRUE.equals(cc.getIsPrimary()))
                                                        .findFirst()
                                                        .map(cc -> cc.getCategory().getName())
                                                        .orElse(null);

                                        var activeLessons = course.getSections().stream()
                                                        .filter(s -> !Boolean.TRUE.equals(s.getIsDeleted()))
                                                        .flatMap(s -> s.getLessons().stream())
                                                        .filter(l -> !Boolean.TRUE.equals(l.getIsDeleted()))
                                                        .toList();

                                        long lessonCount = activeLessons.size();

                                        long totalDurationSeconds = activeLessons.stream()
                                                        .mapToLong(l -> l.getDurationSeconds() != null
                                                                        ? l.getDurationSeconds()
                                                                        : 0)
                                                        .sum();

                                        long studentCount = enrollmentCountByCourseId.getOrDefault(course.getId(), 0L);

                                        ReviewRepository.CourseRatingProjection rating = ratingByCourseId.get(course.getId());
                                        double avgRating = rating != null && rating.getAvgRating() != null
                                                        ? rating.getAvgRating()
                                                        : 0.0;

                                        return new FeaturedCourseResponse(
                                                        course.getId(),
                                                        course.getTitle(),
                                                        course.getThumbnailKey(),
                                                        course.getInstructor().getFullName(),
                                                        course.getBasePrice(),
                                                        discountByCourseId.get(course.getId()),
                                                        studentCount,
                                                        lessonCount,
                                                        totalDurationSeconds,
                                                        categoryName,
                                                        course.getLevel(),
                                                        avgRating);
                                })
                                .toList();
        }

        @Transactional(readOnly = true)
        public com.example.back_end.dto.response.PlatformStatsResponse getPlatformStats() {
                long totalLearners = enrollmentRepository.countDistinctUsers();
                long totalCourses = courseRepository.countByStatusAndIsDeletedFalse(CourseStatus.PUBLISHED);
                double avgRating = reviewRepository.getPlatformAverageRating();

                return new com.example.back_end.dto.response.PlatformStatsResponse(
                                totalLearners, totalCourses, avgRating);
        }

        @Transactional(readOnly = true)
        public List<TopCategoryResponse> getTopCategories() {
                List<Course> published = courseRepository.findAllByStatus(CourseStatus.PUBLISHED);

                List<Long> courseIds = published.stream()
                                .map(Course::getId)
                                .toList();

                Map<Long, Long> enrollmentCountByCourseId = courseIds.isEmpty()
                                ? Map.of()
                                : enrollmentRepository.findByCourseIdIn(courseIds)
                                                .stream()
                                                .collect(Collectors.groupingBy(e -> e.getCourse().getId(),
                                                                Collectors.counting()));

                Map<Category, Long> soldCountByCategory = new LinkedHashMap<>();
                for (Course course : published) {
                        long soldCount = enrollmentCountByCourseId.getOrDefault(course.getId(), 0L);
                        for (Coursecategory coursecategory : course.getCoursecategories()) {
                                Category category = coursecategory.getCategory();
                                if (Boolean.TRUE.equals(category.getIsDeleted())) {
                                        continue;
                                }
                                soldCountByCategory.merge(category, soldCount, Long::sum);
                        }
                }

                return soldCountByCategory.entrySet().stream()
                                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                                .limit(8)
                                .map(entry -> new TopCategoryResponse(
                                                entry.getKey().getId(),
                                                entry.getKey().getName(),
                                                entry.getKey().getSlug(),
                                                entry.getValue()))
                                .toList();
        }

        @Transactional(readOnly = true)
        public List<PublicCourseResponse> getPublishedCourses() {
                List<Course> courses = courseRepository
                                .findByStatusAndIsDeletedFalseOrderByCreatedAtDesc(CourseStatus.PUBLISHED);

                List<Long> courseIds = courses.stream().map(Course::getId).toList();

                Map<Long, Long> studentCountByCourseId = courseIds.isEmpty()
                                ? Map.of()
                                : enrollmentRepository.findByCourseIdIn(courseIds)
                                                .stream()
                                                .collect(Collectors.groupingBy(e -> e.getCourse().getId(),
                                                                Collectors.counting()));

                Map<Long, ReviewRepository.CourseRatingProjection> ratingByCourseId = courseIds.isEmpty()
                                ? Map.of()
                                : reviewRepository.findAvgRatingByCourseIds(courseIds)
                                                .stream()
                                                .collect(Collectors.toMap(
                                                                ReviewRepository.CourseRatingProjection::getCourseId,
                                                                r -> r));

                return courses.stream()
                                .map(course -> toPublicCourseResponse(
                                                course,
                                                studentCountByCourseId.getOrDefault(course.getId(), 0L),
                                                ratingByCourseId.get(course.getId())))
                                .toList();
        }

        @Transactional(readOnly = true)
        public PublicCourseResponse getPublishedCourse(Long courseId) {
                Course course = courseRepository.findById(courseId)
                                .filter(item -> item.getStatus() == CourseStatus.PUBLISHED)
                                .filter(item -> !Boolean.TRUE.equals(item.getIsDeleted()))
                                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));

                long studentCount = enrollmentRepository.countByCourseId(courseId);
                ReviewRepository.CourseRatingProjection rating = reviewRepository
                                .findAvgRatingByCourseIds(List.of(courseId))
                                .stream()
                                .findFirst()
                                .orElse(null);

                return toPublicCourseResponse(course, studentCount, rating);
        }

        private PublicCourseResponse toPublicCourseResponse(
                        Course course,
                        long studentCount,
                        ReviewRepository.CourseRatingProjection rating) {
                String categoryName = course.getCoursecategories().stream()
                                .filter(cc -> Boolean.TRUE.equals(cc.getIsPrimary()))
                                .findFirst()
                                .map(cc -> cc.getCategory().getName())
                                .orElse(null);

                var activeLessons = course.getSections().stream()
                                .filter(s -> !Boolean.TRUE.equals(s.getIsDeleted()))
                                .flatMap(s -> s.getLessons().stream())
                                .filter(l -> !Boolean.TRUE.equals(l.getIsDeleted()))
                                .toList();

                long lessonCount = activeLessons.size();
                long totalDurationSeconds = activeLessons.stream()
                                .mapToLong(l -> l.getDurationSeconds() != null ? l.getDurationSeconds() : 0)
                                .sum();

                double avgRating = rating != null && rating.getAvgRating() != null ? rating.getAvgRating() : 0;
                long ratingCount = rating != null && rating.getRatingCount() != null ? rating.getRatingCount() : 0;

                return new PublicCourseResponse(
                                course.getId(),
                                course.getTitle(),
                                course.getDescription(),
                                course.getInstructor().getFullName(),
                                course.getBasePrice(),
                                course.getLevel(),
                                course.getStatus(),
                                course.getThumbnailKey(),
                                categoryName,
                                studentCount,
                                lessonCount,
                                totalDurationSeconds,
                                avgRating,
                                ratingCount);
        }

        @Transactional(readOnly = true)
        public List<TeacherStudentResponse> getMyStudents(String email) {
                User instructor = userRepository
                                .findByEmailAndIsDeletedFalse(email)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                List<Enrollment> enrollments = enrollmentRepository.findByInstructorId(instructor.getId());

                // Group enrollments by student, preserving earliest enrolledAt
                Map<Long, List<Enrollment>> byStudent = enrollments.stream()
                                .collect(Collectors.groupingBy(e -> e.getUser().getId()));

                return byStudent.entrySet().stream()
                                .map(entry -> {
                                        List<Enrollment> studentEnrollments = entry.getValue();
                                        User student = studentEnrollments.get(0).getUser();

                                        List<String> courseNames = studentEnrollments.stream()
                                                        .map(e -> e.getCourse().getTitle())
                                                        .distinct()
                                                        .toList();

                                        Instant earliestEnrolledAt = studentEnrollments.stream()
                                                        .map(Enrollment::getEnrolledAt)
                                                        .min(Comparator.naturalOrder())
                                                        .orElse(null);

                                        int avgProgress = (int) studentEnrollments.stream()
                                                        .mapToInt(e -> e.getProgressPercent() != null
                                                                        ? e.getProgressPercent()
                                                                        : 0)
                                                        .average()
                                                        .orElse(0);

                                        return new TeacherStudentResponse(
                                                        student.getId(),
                                                        student.getFullName(),
                                                        student.getEmail(),
                                                        s3Service.resolveAvatarUrl(student.getAvatar()),
                                                        courseNames,
                                                        earliestEnrolledAt,
                                                        avgProgress);
                                })
                                .sorted(Comparator.comparing(
                                                TeacherStudentResponse::enrolledAt,
                                                Comparator.nullsLast(Comparator.reverseOrder())))
                                .toList();
        }

        @Transactional(readOnly = true)
        public List<TeacherReviewResponse> getMyReviews(String email) {
                User instructor = userRepository
                                .findByEmailAndIsDeletedFalse(email)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                List<Long> courseIds = courseRepository
                                .findByInstructorIdOrderByCreatedAtDesc(instructor.getId())
                                .stream()
                                .map(Course::getId)
                                .toList();

                if (courseIds.isEmpty()) {
                        return List.of();
                }

                return reviewRepository.findByCourseIdInWithUserAndCourse(courseIds)
                                .stream()
                                .map(review -> new TeacherReviewResponse(
                                                review.getId(),
                                                review.getCourse().getId(),
                                                review.getCourse().getTitle(),
                                                review.getUser().getId(),
                                                review.getUser().getFullName(),
                                                s3Service.resolveAvatarUrl(review.getUser().getAvatar()),
                                                review.getRating(),
                                                review.getComment(),
                                                review.getCreatedAt()))
                                .toList();
        }

        public String getHlsMasterPlaylistPathIfReady(String fileKey) {
                return lessonRepository.findByVideoKey(fileKey)
                                .filter(lesson -> lesson.getHlsStatus() == HlsStatus.READY)
                                .map(Lesson::getVideoKey)
                                .map(MediaConvertService::videoUuidFromKey)
                                .map(videoUuid -> "/api/learnova/courses/hls/" + videoUuid + "/master.m3u8")
                                .orElse(null);
        }
}