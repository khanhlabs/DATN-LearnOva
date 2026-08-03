package com.example.back_end.service;

import com.example.back_end.dto.response.CourseDetailResponse;
import com.example.back_end.dto.response.FeaturedCourseResponse;
import com.example.back_end.dto.response.PlatformStatsResponse;
import com.example.back_end.dto.response.PublicCourseResponse;
import com.example.back_end.dto.response.TopCategoryResponse;
import com.example.back_end.entity.enums.CourseStatus;
import com.example.back_end.entity.enums.HlsStatus;
import com.example.back_end.exception.ResourceNotFoundException;
import com.example.back_end.repository.CourseRepository;
import com.example.back_end.repository.EnrollmentRepository;
import com.example.back_end.repository.InstructorProfileRepository;
import com.example.back_end.repository.LessonRepository;
import com.example.back_end.repository.PromotionCourseRepository;
import com.example.back_end.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CourseService {

    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final PromotionCourseRepository promotionCourseRepository;
    private final ReviewRepository reviewRepository;
    private final LessonRepository lessonRepository;
    private final InstructorProfileRepository instructorProfileRepository;
    private final S3Service s3Service;

    @Transactional(readOnly = true)
    public CourseDetailResponse getCourseDetail(Long courseId) {
        Course course = courseRepository.findCourseDetailById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));

        var primaryCategory = course.getCourseCategories().stream()
                .filter(cc -> Boolean.TRUE.equals(cc.getIsPrimary()))
                .findFirst()
                .orElse(null);

        String categoryName = primaryCategory != null ? primaryCategory.getCategory().getName() : null;
        Long categoryId = primaryCategory != null ? primaryCategory.getCategory().getId() : null;

        List<CourseDetailResponse.SectionInfo> sections = course.getSections().stream()
                .filter(s -> !Boolean.TRUE.equals(s.getIsDeleted()))
                .sorted(Comparator.comparingDouble(s -> s.getSectionOrder() != null ? s.getSectionOrder() : 0.0))
                .map(s -> {
                    List<CourseDetailResponse.LessonInfo> lessons = s.getLessons().stream()
                            .filter(l -> !Boolean.TRUE.equals(l.getIsDeleted()))
                            .sorted(Comparator.comparingDouble(l -> l.getLessonOrder() != null ? l.getLessonOrder() : 0.0))
                            .map(l -> new CourseDetailResponse.LessonInfo(
                                    l.getId(),
                                    l.getTitle(),
                                    l.getLessonOrder(),
                                    l.getDurationSeconds(),
                                    l.getVideoKey(),
                                    l.getIsPreview()
                            ))
                            .toList();

                    return new CourseDetailResponse.SectionInfo(
                            s.getId(),
                            s.getTitle(),
                            s.getSectionOrder(),
                            lessons
                    );
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

        CourseDetailResponse.InstructorInfo instructorInfo =
                new CourseDetailResponse.InstructorInfo(
                        instructor.getId(),
                        instructor.getFullName(),
                        s3Service.resolveAvatarUrl(instructor.getAvatar()),
                        instructorDescription
                );

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
                sections
        );
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
                .collect(Collectors.groupingBy(e -> e.getCourse().getId(), Collectors.counting()));

        List<Course> top8 = published.stream()
                .sorted((a, b) -> Long.compare(
                        enrollmentCountByCourseId.getOrDefault(b.getId(), 0L),
                        enrollmentCountByCourseId.getOrDefault(a.getId(), 0L)
                ))
                .limit(8)
                .toList();

        Instant now = Instant.now();
        List<Long> top8Ids = top8.stream().map(Course::getId).toList();
        Map<Long, Integer> discountByCourseId = top8Ids.isEmpty()
                ? Map.of()
                : promotionCourseRepository.findActivePromotionsByCourseIds(top8Ids, now)
                .stream()
                .collect(Collectors.toMap(
                        pc -> pc.getCourse().getId(),
                        pc -> pc.getPromotion().getDiscountPercent(),
                        (a, b) -> a
                ));

        Map<Long, ReviewRepository.CourseRatingProjection> ratingByCourseId = top8Ids.isEmpty()
                ? Map.of()
                : reviewRepository.findAvgRatingByCourseIds(top8Ids)
                .stream()
                .collect(Collectors.toMap(
                        ReviewRepository.CourseRatingProjection::getCourseId,
                        r -> r
                ));

        return top8.stream()
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
                            avgRating
                    );
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public PlatformStatsResponse getPlatformStats() {
        long totalLearners = enrollmentRepository.countDistinctUsers();
        long totalCourses = courseRepository.countByStatusAndIsDeletedFalse(CourseStatus.PUBLISHED);
        double avgRating = reviewRepository.getPlatformAverageRating();

        return new PlatformStatsResponse(totalLearners, totalCourses, avgRating);
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
                .collect(Collectors.groupingBy(e -> e.getCourse().getId(), Collectors.counting()));

        Map<Category, Long> soldCountByCategory = new LinkedHashMap<>();
        for (Course course : published) {
            long soldCount = enrollmentCountByCourseId.getOrDefault(course.getId(), 0L);
            for (CourseCategory courseCategory : course.getCourseCategories()) {
                Category category = courseCategory.getCategory();
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
                        entry.getValue()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PublicCourseResponse> getPublishedCourses() {
        List<Course> courses = courseRepository
                .findByStatusAndIsDeletedFalseAndIsHiddenFalseOrderByCreatedAtDesc(CourseStatus.PUBLISHED);

        List<Long> courseIds = courses.stream().map(Course::getId).toList();

        Map<Long, Long> studentCountByCourseId = courseIds.isEmpty()
                ? Map.of()
                : enrollmentRepository.findByCourseIdIn(courseIds)
                .stream()
                .collect(Collectors.groupingBy(e -> e.getCourse().getId(), Collectors.counting()));

        Map<Long, ReviewRepository.CourseRatingProjection> ratingByCourseId = courseIds.isEmpty()
                ? Map.of()
                : reviewRepository.findAvgRatingByCourseIds(courseIds)
                .stream()
                .collect(Collectors.toMap(ReviewRepository.CourseRatingProjection::getCourseId, r -> r));

        return courses.stream()
                .map(course -> toPublicCourseResponse(
                        course,
                        studentCountByCourseId.getOrDefault(course.getId(), 0L),
                        ratingByCourseId.get(course.getId())
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public PublicCourseResponse getPublishedCourse(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .filter(item -> item.getStatus() == CourseStatus.PUBLISHED)
                .filter(item -> !Boolean.TRUE.equals(item.getIsDeleted()))
                .filter(item -> !Boolean.TRUE.equals(item.getIsHidden()))
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));

        long studentCount = enrollmentRepository.countByCourseId(courseId);
        ReviewRepository.CourseRatingProjection rating = reviewRepository
                .findAvgRatingByCourseIds(List.of(courseId))
                .stream()
                .findFirst()
                .orElse(null);

        return toPublicCourseResponse(course, studentCount, rating);
    }

    @Transactional(readOnly = true)
    public List<PublicCourseResponse> getPublishedCoursesByInstructor(Long instructorId) {
        List<Course> courses = courseRepository
                .findByInstructorIdAndStatusAndIsDeletedFalseAndIsHiddenFalse(instructorId, CourseStatus.PUBLISHED);

        List<Long> courseIds = courses.stream().map(Course::getId).toList();

        Map<Long, Long> studentCountByCourseId = courseIds.isEmpty()
                ? Map.of()
                : enrollmentRepository.findByCourseIdIn(courseIds)
                .stream()
                .collect(Collectors.groupingBy(e -> e.getCourse().getId(), Collectors.counting()));

        Map<Long, ReviewRepository.CourseRatingProjection> ratingByCourseId = courseIds.isEmpty()
                ? Map.of()
                : reviewRepository.findAvgRatingByCourseIds(courseIds)
                .stream()
                .collect(Collectors.toMap(ReviewRepository.CourseRatingProjection::getCourseId, r -> r));

        return courses.stream()
                .map(course -> toPublicCourseResponse(
                        course,
                        studentCountByCourseId.getOrDefault(course.getId(), 0L),
                        ratingByCourseId.get(course.getId())
                ))
                .toList();
    }

    private PublicCourseResponse toPublicCourseResponse(
            Course course,
            long studentCount,
            ReviewRepository.CourseRatingProjection rating
    ) {
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
                ratingCount
        );
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
