package com.example.back_end.service.teacher;

import com.example.back_end.dto.request.teacher.CreateDraftCourseRequest;
import com.example.back_end.dto.request.teacher.UpdateCourseRequest;
import com.example.back_end.dto.response.teacher.TeacherCoursesResponse;
import com.example.back_end.entity.Category;
import com.example.back_end.entity.Course;
import com.example.back_end.entity.CourseCategory;
import com.example.back_end.entity.CourseCategoryId;
import com.example.back_end.entity.User;
import com.example.back_end.entity.enums.CourseStatus;
import com.example.back_end.entity.enums.NotificationType;
import com.example.back_end.exception.BusinessException;
import com.example.back_end.exception.ResourceNotFoundException;
import com.example.back_end.repository.CourseRepository;
import com.example.back_end.repository.CourseCategoryRepository;
import com.example.back_end.repository.EnrollmentRepository;
import com.example.back_end.repository.ReviewRepository;
import com.example.back_end.repository.UserRepository;
import com.example.back_end.repository.admin.AdminCategoryRepository;
import com.example.back_end.service.CourseIndexService;
import com.example.back_end.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TeacherCourseService {

    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final CourseCategoryRepository courseCategoryRepository;
    private final AdminCategoryRepository categoryRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ReviewRepository reviewRepository;
    private final NotificationService notificationService;
    private final CourseIndexService courseIndexService;

    private static final Set<CourseStatus> TEACHER_SETTABLE_STATUSES = EnumSet.of(CourseStatus.DRAFT, CourseStatus.PENDING_REVIEW);

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
        course.setIsHidden(false);
        course.setSlug(UUID.randomUUID().toString());
        course.setCreatedAt(Instant.now());
        course.setUpdatedAt(Instant.now());

        courseRepository.save(course);
        courseIndexService.sync(course);

        if (request.categoryId() != null) {
            Category category = categoryRepository.findActiveById(request.categoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

            CourseCategoryId ccId = new CourseCategoryId();
            ccId.setCourseId(course.getId());
            ccId.setCategoryId(category.getId());

            CourseCategory cc = new CourseCategory();
            cc.setId(ccId);
            cc.setCourse(course);
            cc.setCategory(category);
            cc.setIsPrimary(true);

            courseCategoryRepository.save(cc);
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
            throw new BusinessException("You can only save as draft or submit for review. Publishing requires admin approval.");
        }

        course.setStatus(newStatus);
        course.setUpdatedAt(Instant.now());

        if (newStatus == CourseStatus.PENDING_REVIEW) {
            course.setRejectionReason(null);
            notificationService.createForAll(
                    userRepository.findAllAdmins(),
                    NotificationType.COURSE_SUBMITTED,
                    "New course submitted for review",
                    course.getInstructor().getFullName() + " submitted \"" + course.getTitle() + "\" for review.",
                    "/learnova/admin/course-approval/" + course.getId(),
                    Map.of("courseId", course.getId(), "courseTitle", course.getTitle())
            );
        }

        courseRepository.save(course);
        courseIndexService.sync(course);
    }

    public List<TeacherCoursesResponse> getMyCourses(String email) {
        User instructor = userRepository
                .findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Course> courses = courseRepository
                .findByInstructorIdAndIsDeletedFalseOrderByCreatedAtDesc(instructor.getId());

        List<Long> courseIds = courses.stream()
                .map(Course::getId)
                .toList();

        Map<Long, Long> enrollmentCountByCourseId = courseIds.isEmpty()
                ? Map.of()
                : enrollmentRepository.findByCourseIdIn(courseIds)
                .stream()
                .collect(Collectors.groupingBy(e -> e.getCourse().getId(), Collectors.counting()));

        Map<Long, ReviewRepository.CourseRatingProjection> ratingByCourseId = reviewRepository
                .findAvgRatingByCourseForInstructor(instructor.getId())
                .stream()
                .collect(Collectors.toMap(ReviewRepository.CourseRatingProjection::getCourseId, r -> r));

        return courses.stream()
                .map(course -> {
                    String categoryName = course.getCourseCategories().stream()
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

                    long studentCount = enrollmentCountByCourseId.getOrDefault(course.getId(), 0L);

                    ReviewRepository.CourseRatingProjection rating = ratingByCourseId.get(course.getId());
                    double avgRating = rating != null && rating.getAvgRating() != null ? rating.getAvgRating() : 0;
                    long ratingCount = rating != null && rating.getRatingCount() != null ? rating.getRatingCount() : 0;

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
                            course.getIsHidden(),
                            course.getRejectionReason(),
                            avgRating,
                            ratingCount
                    );
                })
                .toList();
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
        courseIndexService.sync(course);

        if (request.categoryId() != null) {
            courseCategoryRepository.deleteByCourseId(courseId);

            Category category = categoryRepository.findActiveById(request.categoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

            CourseCategoryId ccId = new CourseCategoryId();
            ccId.setCourseId(courseId);
            ccId.setCategoryId(category.getId());

            CourseCategory cc = new CourseCategory();
            cc.setId(ccId);
            cc.setCourse(course);
            cc.setCategory(category);
            cc.setIsPrimary(true);

            courseCategoryRepository.save(cc);
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
        courseIndexService.sync(course);
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

        boolean newHiddenState = !Boolean.TRUE.equals(course.getIsHidden());
        course.setIsHidden(newHiddenState);
        course.setUpdatedAt(Instant.now());
        courseRepository.save(course);
        courseIndexService.sync(course);
        return newHiddenState;
    }

}
