package com.example.back_end.service;

import com.example.back_end.dto.response.PublicInstructorDetailResponse;
import com.example.back_end.dto.response.PublicInstructorDetailResponse.CourseSummary;
import com.example.back_end.dto.response.PublicInstructorDetailResponse.ReviewSummary;
import com.example.back_end.dto.response.PublicInstructorProfileResponse;
import com.example.back_end.dto.response.PublicInstructorResponse;
import com.example.back_end.dto.response.PublicInstructorSummaryResponse;
import com.example.back_end.entity.Course;
import com.example.back_end.entity.InstructorProfile;
import com.example.back_end.entity.Review;
import com.example.back_end.entity.User;
import com.example.back_end.entity.enums.CourseStatus;
import com.example.back_end.entity.enums.RoleName;
import com.example.back_end.exception.ResourceNotFoundException;
import com.example.back_end.repository.CourseRepository;
import com.example.back_end.repository.EnrollmentRepository;
import com.example.back_end.repository.InstructorFollowRepository;
import com.example.back_end.repository.InstructorProfileRepository;
import com.example.back_end.repository.ReviewRepository;
import com.example.back_end.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PublicInstructorService {

    private static final int RECENT_REVIEW_LIMIT = 10;

    private final UserRepository userRepository;
    private final InstructorProfileRepository instructorProfileRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ReviewRepository reviewRepository;
    private final CourseService courseService;
    private final InstructorFollowRepository instructorFollowRepository;
    private final S3Service s3Service;

    public List<PublicInstructorSummaryResponse> listInstructors() {
        return userRepository.findAllTeachers().stream()
                .map(this::toSummary)
                .toList();
    }

    public PublicInstructorProfileResponse getInstructorProfile(Long instructorId) {
        User instructor = userRepository.findById(instructorId)
                .filter(u -> !Boolean.TRUE.equals(u.getIsDeleted()))
                .filter(u -> u.getRoles().stream().anyMatch(r -> r.getRoleName() == RoleName.ROLE_TEACHER))
                .orElseThrow(() -> new ResourceNotFoundException("Instructor not found"));

        InstructorProfile profile = instructorProfileRepository.findById(instructorId).orElse(null);

        return new PublicInstructorProfileResponse(
                instructor.getId(),
                instructor.getFullName(),
                instructor.getAvatar(),
                profile != null ? profile.getAvatarKey() : null,
                profile != null ? profile.getHeadline() : null,
                profile != null ? profile.getDescription() : null,
                profile != null ? profile.getExpertise() : null,
                profile != null ? profile.getSocialLinks() : null,
                instructor.getCreatedAt(),
                courseRepository.countByInstructorIdAndStatusAndIsDeletedFalseAndIsHiddenFalse(instructorId, CourseStatus.PUBLISHED),
                enrollmentRepository.countDistinctStudentsByInstructorId(instructorId),
                reviewRepository.getAverageRatingByInstructorId(instructorId),
                reviewRepository.countByCourseInstructorId(instructorId),
                courseService.getPublishedCoursesByInstructor(instructorId)
        );
    }

    private PublicInstructorSummaryResponse toSummary(User instructor) {
        InstructorProfile profile = instructorProfileRepository.findById(instructor.getId()).orElse(null);

        return new PublicInstructorSummaryResponse(
                instructor.getId(),
                instructor.getFullName(),
                instructor.getAvatar(),
                profile != null ? profile.getAvatarKey() : null,
                profile != null ? profile.getHeadline() : null,
                profile != null ? profile.getExpertise() : null,
                courseRepository.countByInstructorIdAndStatusAndIsDeletedFalseAndIsHiddenFalse(instructor.getId(), CourseStatus.PUBLISHED),
                enrollmentRepository.countDistinctStudentsByInstructorId(instructor.getId()),
                reviewRepository.getAverageRatingByInstructorId(instructor.getId()),
                reviewRepository.countByCourseInstructorId(instructor.getId())
        );
    }

    public List<PublicInstructorResponse> getPublicInstructors() {
        return userRepository.findAllTeachers().stream()
                .map(this::toPublicInstructorResponse)
                .toList();
    }

    public PublicInstructorDetailResponse getPublicInstructorDetail(Long instructorId) {
        User user = userRepository.findAllTeachers().stream()
                .filter(teacher -> teacher.getId().equals(instructorId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Instructor not found"));

        InstructorProfile profile = instructorProfileRepository.findByUserId(instructorId).orElse(null);

        List<Course> courses = courseRepository
                .findByInstructorIdAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(
                        instructorId, CourseStatus.PUBLISHED);

        List<CourseSummary> courseSummaries = courses.stream()
                .map(course -> {
                    long studentCount = enrollmentRepository.countByCourseId(course.getId());
                    double courseRating = reviewRepository.getAverageRating(course.getId());
                    long courseReviewCount = reviewRepository.countByCourseId(course.getId());

                    return new CourseSummary(
                            course.getId(),
                            course.getTitle(),
                            course.getThumbnailKey(),
                            course.getBasePrice(),
                            courseRating,
                            courseReviewCount,
                            studentCount);
                })
                .toList();

        List<ReviewSummary> reviewSummaries = reviewRepository
                .findRecentByInstructorId(instructorId, PageRequest.of(0, RECENT_REVIEW_LIMIT))
                .stream()
                .map(this::toReviewSummary)
                .toList();

        long studentCount = enrollmentRepository.countDistinctStudentsByInstructorId(instructorId);
        double rating = reviewRepository.getAverageRatingByInstructorId(instructorId);
        long reviewCount = reviewRepository.countByCourseInstructorId(instructorId);
        long followerCount = instructorFollowRepository.countByInstructor_Id(instructorId);

        return new PublicInstructorDetailResponse(
                user.getId(),
                user.getFullName(),
                s3Service.resolveAvatarUrl(user.getAvatar()),
                profile != null ? profile.getHeadline() : null,
                profile != null ? profile.getDescription() : null,
                parseExpertise(profile),
                profile != null ? profile.getSocialLinks() : null,
                rating,
                reviewCount,
                studentCount,
                courses.size(),
                followerCount,
                courseSummaries,
                reviewSummaries);
    }

    private PublicInstructorResponse toPublicInstructorResponse(User user) {
        InstructorProfile profile = instructorProfileRepository.findByUserId(user.getId()).orElse(null);

        long courseCount = courseRepository.countByInstructorIdAndIsDeletedFalse(user.getId());
        long studentCount = enrollmentRepository.countDistinctStudentsByInstructorId(user.getId());
        double rating = reviewRepository.getAverageRatingByInstructorId(user.getId());
        long reviewCount = reviewRepository.countByCourseInstructorId(user.getId());
        long followerCount = instructorFollowRepository.countByInstructor_Id(user.getId());

        return new PublicInstructorResponse(
                user.getId(),
                user.getFullName(),
                s3Service.resolveAvatarUrl(user.getAvatar()),
                profile != null ? profile.getHeadline() : null,
                profile != null ? profile.getDescription() : null,
                parseExpertise(profile),
                rating,
                reviewCount,
                studentCount,
                courseCount,
                followerCount);
    }

    private ReviewSummary toReviewSummary(Review review) {
        return new ReviewSummary(
                review.getUser().getFullName(),
                s3Service.resolveAvatarUrl(review.getUser().getAvatar()),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt(),
                review.getCourse().getTitle());
    }

    private List<String> parseExpertise(InstructorProfile profile) {
        if (profile == null || profile.getExpertise() == null || profile.getExpertise().isBlank()) {
            return List.of();
        }

        return Arrays.stream(profile.getExpertise().split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .toList();
    }
}
