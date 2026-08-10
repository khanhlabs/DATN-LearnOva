package com.example.back_end.assessment.application;
import com.example.back_end.learning.application.LessonProgressService;
import com.example.back_end.notification.application.NotificationService;
import com.example.back_end.media.infrastructure.storage.S3Service;

import com.example.back_end.assessment.adapter.in.web.dto.CreateReviewRequest;
import com.example.back_end.assessment.adapter.in.web.dto.ReviewResponse;
import com.example.back_end.assessment.adapter.in.web.dto.RatingSummaryResponse;
import com.example.back_end.course.domain.Course;
import com.example.back_end.assessment.domain.Review;
import com.example.back_end.auth.domain.User;
import com.example.back_end.notification.domain.enums.NotificationType;
import com.example.back_end.shared.exception.BusinessException;
import com.example.back_end.shared.exception.ResourceNotFoundException;
import com.example.back_end.assessment.infrastructure.persistence.ReviewRepository;
import com.example.back_end.auth.infrastructure.persistence.UserRepository;
import com.example.back_end.admin.infrastructure.persistence.AdminCourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.back_end.assessment.adapter.in.web.dto.UpdateReviewRequest;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import com.example.back_end.assessment.adapter.in.web.dto.CourseReviewResponse;
import com.example.back_end.assessment.adapter.in.web.dto.TestimonialResponse;
import org.springframework.data.domain.PageRequest;


@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final AdminCourseRepository adminCourseRepository;
    private final LessonProgressService lessonProgressService;
    private final NotificationService notificationService;
    private final S3Service s3Service;

    @Transactional
    public ReviewResponse createReview(
            Long userId,
            CreateReviewRequest request
    ) {
        if (reviewRepository.findByUserIdAndCourseId(
                userId,
                request.getCourseId()
        ).isPresent()) {
            throw new BusinessException("You have already reviewed this course");
        }

        var progress = lessonProgressService.getCourseProgress(userId, request.getCourseId());
        if (!progress.isCourseCompleted()) {
            throw new BusinessException("You must complete all lessons in the course before writing a review.");
        }
        // 1. Kiểm tra User
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("LỖI: Không tìm thấy người dùng với ID = " + userId));
        Course course = adminCourseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("LỖI: Không tìm thấy khóa học với ID = " + request.getCourseId()));

        Review review = new Review();
        review.setUser(user);
        review.setCourse(course);
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        Instant now = Instant.now();
        review.setCreatedAt(now);
        review.setUpdatedAt(now);
        reviewRepository.save(review);

        notificationService.create(
                course.getInstructor(),
                NotificationType.NEW_REVIEW,
                "New review received",
                user.getFullName() + " left a " + review.getRating() + "-star review on \"" + course.getTitle() + "\".",
                "/learnova/teacher/reviews",
                Map.of("courseId", course.getId(), "reviewId", review.getId(), "rating", review.getRating())
        );

        return toResponse(review);
    }

    public List<ReviewResponse> getCourseReviews(
            Long courseId
    ) {

        return reviewRepository.findByCourseIdWithUser(courseId)
            .stream()
                .map(this::toResponse)
        .toList();
    }

    private ReviewResponse toResponse(Review review) {
        return ReviewResponse.builder()
                .reviewId(review.getId())
                .userId(review.getUser().getId())
                .userName(review.getUser().getFullName())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .edited(review.getCreatedAt() != null
                        && review.getUpdatedAt() != null
                        && review.getUpdatedAt().isAfter(review.getCreatedAt()))
                .instructorReply(review.getInstructorReply())
                .repliedAt(review.getRepliedAt())
                .build();
    }

    @Transactional
    public ReviewResponse updateReview(Long userId, UpdateReviewRequest request) {

        if (request == null || request.getReviewId() == null) {
            throw new BusinessException("Review ID cannot be null");
        }
        // 1. Tìm review trong DB dựa vào ID gửi lên
        Review review = reviewRepository.findById(request.getReviewId())
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));
        if (!review.getUser().getId().equals(userId)) {
            throw new BusinessException("You cannot update this review");
        }
        // 3. Cập nhật dữ liệu mới
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review.setUpdatedAt(Instant.now());
        // 4. Lưu lại vào DB
        reviewRepository.save(review);
        return toResponse(review);
    }

    @Transactional
    public void deleteReview(Long userId, Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));
        if (!review.getUser().getId().equals(userId)) {
            throw new BusinessException("You cannot delete this review");
        }
        reviewRepository.delete(review);
    }

    public RatingSummaryResponse getRatingSummary(Long courseId) {
        List<Review> reviews = reviewRepository.findByCourseId(courseId);
        if (reviews.isEmpty()) {
            return new RatingSummaryResponse(0, 0);
        }
        double avg = reviews.stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0);

        long total = reviews.size();
        return new RatingSummaryResponse(avg, total);
    }
    public CourseReviewResponse getCourseReviewSummary(Long courseId) {

        List<ReviewResponse> reviews = reviewRepository.findByCourseIdWithUser(courseId)
                .stream()
                .map(this::toResponse)
                .toList();

        return CourseReviewResponse.builder()
                .averageRating(reviewRepository.getAverageRating(courseId))
                .reviewCount(reviewRepository.countByCourseId(courseId))
                .reviews(reviews)
                .build();
    }

    public List<TestimonialResponse> getPlatformTestimonials(int limit) {
        return reviewRepository.findTopTestimonials(PageRequest.of(0, limit))
                .stream()
                .map(review -> new TestimonialResponse(
                        review.getId(),
                        review.getUser().getFullName(),
                        s3Service.resolveAvatarUrl(review.getUser().getAvatar()),
                        review.getRating(),
                        review.getComment(),
                        review.getCourse().getTitle()))
                .toList();
    }
}
