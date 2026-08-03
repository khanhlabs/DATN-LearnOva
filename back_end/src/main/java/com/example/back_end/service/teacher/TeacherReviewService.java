package com.example.back_end.service.teacher;

import com.example.back_end.dto.response.teacher.TeacherReviewResponse;
import com.example.back_end.entity.Course;
import com.example.back_end.entity.Review;
import com.example.back_end.entity.User;
import com.example.back_end.exception.BusinessException;
import com.example.back_end.exception.ResourceNotFoundException;
import com.example.back_end.repository.CourseRepository;
import com.example.back_end.repository.ReviewRepository;
import com.example.back_end.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TeacherReviewService {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final ReviewRepository reviewRepository;

    @Transactional(readOnly = true)
    public List<TeacherReviewResponse> getMyReviews(String email) {
        User instructor = userRepository
                .findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Long> courseIds = courseRepository
                .findByInstructorIdAndIsDeletedFalseOrderByCreatedAtDesc(instructor.getId())
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
                        review.getUser().getAvatar(),
                        review.getRating(),
                        review.getComment(),
                        review.getInstructorReply(),
                        review.getRepliedAt(),
                        review.getCreatedAt(),
                        review.getUpdatedAt()
                ))
                .toList();
    }

    public void replyToReview(Long reviewId, String email, String reply) {
        User instructor = userRepository
                .findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));

        if (!review.getCourse().getInstructor().getId().equals(instructor.getId())) {
            throw new BusinessException("You don't have permission to reply to this review");
        }

        review.setInstructorReply(reply);
        review.setRepliedAt(OffsetDateTime.now());
        reviewRepository.save(review);
    }
}
