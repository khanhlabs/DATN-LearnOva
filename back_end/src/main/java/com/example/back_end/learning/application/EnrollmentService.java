package com.example.back_end.learning.application;
import com.example.back_end.media.infrastructure.storage.S3Service;
import com.example.back_end.course.domain.Tag;

import com.example.back_end.learning.adapter.in.web.dto.ContinueLearningResponse;
import com.example.back_end.learning.adapter.in.web.dto.MyEnrolledCourseResponse;
import com.example.back_end.course.domain.Course;
import com.example.back_end.learning.domain.Enrollment;
import com.example.back_end.instructor.domain.InstructorProfile;
import com.example.back_end.course.infrastructure.persistence.CourseRepository;
import com.example.back_end.learning.infrastructure.persistence.EnrollmentRepository;
import com.example.back_end.instructor.infrastructure.persistence.InstructorProfileRepository;
import com.example.back_end.course.infrastructure.persistence.LessonRepository;
import com.example.back_end.learning.infrastructure.persistence.LessonProgressRepository;
import com.example.back_end.assessment.infrastructure.persistence.ReviewRepository;
import com.example.back_end.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Comparator;

@Service
@RequiredArgsConstructor
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final LessonRepository lessonRepository;
    private final ReviewRepository reviewRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final InstructorProfileRepository instructorProfileRepository;
    private final CourseRepository courseRepository;
    private final S3Service s3Service;

    @Transactional(readOnly = true)
    public List<MyEnrolledCourseResponse> getMyEnrolledCourses() {
        Long userId = getCurrentUserId();

        return enrollmentRepository.findByUserIdWithCourseAndInstructor(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private MyEnrolledCourseResponse toResponse(Enrollment enrollment) {

        Course course = enrollment.getCourse();

        long totalLessons =
                lessonRepository.countBySectionCourseId(course.getId());

        long completedLessons =
                lessonProgressRepository.countCompletedLessonsByUserAndCourse(
                        enrollment.getUser().getId(),
                        course.getId()
                );

        long totalDurationSeconds =
                lessonRepository.sumDurationSecondsBySectionCourseId(course.getId());

        double averageRating =
                reviewRepository.getAverageRating(course.getId());

        long reviewCount =
                reviewRepository.countByCourseId(course.getId());
        long studentCount =
                enrollmentRepository.countByCourseId(course.getId());

        String categoryName = course.getCourseCategories().stream()
                .filter(cc -> Boolean.TRUE.equals(cc.getIsPrimary()))
                .findFirst()
                .map(cc -> cc.getCategory().getName())
                .orElse(null);

        List<String> tags = course.getTags().stream()
                .filter(tag -> !Boolean.TRUE.equals(tag.getIsDeleted()))
                .map(com.example.back_end.course.domain.Tag::getName)
                .sorted(Comparator.naturalOrder())
                .toList();

        Long instructorId = course.getInstructor().getId();

        InstructorProfile instructorProfile = instructorProfileRepository
                .findById(instructorId)
                .orElse(null);

        long instructorCourseCount =
                courseRepository.countByInstructorIdAndIsDeletedFalse(instructorId);
        long instructorStudentCount =
                enrollmentRepository.countDistinctStudentsByInstructorId(instructorId);
        double instructorRating =
                reviewRepository.getAverageRatingByInstructorId(instructorId);

        return new MyEnrolledCourseResponse(
                course.getId(),
                course.getTitle(),
                course.getDescription(),
                course.getWhatYouLearn(),
                categoryName,
                tags,

                course.getInstructor().getFullName(),
                s3Service.resolveAvatarUrl(course.getInstructor().getAvatar()),
                instructorProfile != null ? instructorProfile.getHeadline() : null,
                instructorProfile != null ? instructorProfile.getDescription() : null,
                instructorCourseCount,
                instructorStudentCount,
                instructorRating,

                course.getLevel(),

                course.getThumbnailKey(),

                enrollment.getProgressPercent(),

                (int) totalLessons,
                (int) completedLessons,
                totalDurationSeconds,
                averageRating,
                reviewCount,
                studentCount,

                enrollment.getEnrolledAt(),
                enrollment.getCompletedAt(),
                course.getUpdatedAt()
        );
    }

    // Picks the in-progress course to resume: prefers the one with the most
    // recently updated lesson-progress row (real "last watched" signal), and
    // falls back to the most recently enrolled incomplete course if the user
    // has never watched a lesson yet.
    @Transactional(readOnly = true)
    public ContinueLearningResponse getContinueLearning() {
        Long userId = getCurrentUserId();

        List<MyEnrolledCourseResponse> enrolledCourses = getMyEnrolledCourses();
        if (enrolledCourses.isEmpty()) {
            return null;
        }

        java.util.Map<Long, MyEnrolledCourseResponse> byCourseId = enrolledCourses.stream()
                .collect(java.util.stream.Collectors.toMap(
                        MyEnrolledCourseResponse::courseId, c -> c, (a, b) -> a));

        List<Long> recentCourseIds = lessonProgressRepository.findCourseIdsOrderByLastActivity(userId);

        for (Long courseId : recentCourseIds) {
            MyEnrolledCourseResponse course = byCourseId.get(courseId);
            if (course != null && course.completedLessons() < course.totalLessons()) {
                return toContinueLearningResponse(course);
            }
        }

        return enrolledCourses.stream()
                .filter(c -> c.completedLessons() < c.totalLessons())
                .max(Comparator.comparing(MyEnrolledCourseResponse::enrolledAt))
                .map(this::toContinueLearningResponse)
                .orElse(null);
    }

    private ContinueLearningResponse toContinueLearningResponse(MyEnrolledCourseResponse course) {
        int progressPercent = course.totalLessons() > 0
                ? (int) Math.round((course.completedLessons() * 100.0) / course.totalLessons())
                : 0;

        return new ContinueLearningResponse(
                course.courseId(),
                course.title(),
                course.thumbnailKey(),
                progressPercent,
                course.completedLessons(),
                course.totalLessons()
        );
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Object principal = authentication == null ? null : authentication.getPrincipal();

        if (principal instanceof CustomUserDetails userDetails) {
            return userDetails.getId();
        }

        throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Authentication required"
        );
    }
}