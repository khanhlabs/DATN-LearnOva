package com.example.back_end.assessment.adapter.in.web;

import com.example.back_end.assessment.adapter.in.web.dto.CreateReviewRequest;
import com.example.back_end.assessment.adapter.in.web.dto.ReviewResponse;
import com.example.back_end.assessment.application.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.example.back_end.security.CustomUserDetails;
import com.example.back_end.assessment.adapter.in.web.dto.UpdateReviewRequest;
import com.example.back_end.assessment.adapter.in.web.dto.RatingSummaryResponse;
import com.example.back_end.assessment.adapter.in.web.dto.TestimonialResponse;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/learnova")
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping("/review/post")
    public ReviewResponse createReview(
            Authentication authentication,
            @Valid @RequestBody CreateReviewRequest request
    ) {
        if (authentication == null) {
            throw new RuntimeException("No authentication - missing token or filter failed");
        }
        CustomUserDetails userDetails =
                (CustomUserDetails) authentication.getPrincipal();
        Long userId = userDetails.getId();

        return reviewService.createReview(userId, request);
    }

    @GetMapping("/course/{courseId}")
    public List<ReviewResponse> getCourseReviews(
            @PathVariable Long courseId
    ) {
        return reviewService.getCourseReviews(courseId);
    }

    @PutMapping("/review/update")  // /
    public ReviewResponse updateReview(
            Authentication authentication,
            @Valid @RequestBody UpdateReviewRequest request
    ) {
        if (authentication == null) {
            throw new RuntimeException("No authentication");
        }

        CustomUserDetails userDetails =
                (CustomUserDetails) authentication.getPrincipal();

        return reviewService.updateReview(userDetails.getId(), request);
    }

    @DeleteMapping("/review/delete/{reviewId}")
    public void deleteReview(
            Authentication authentication,
            @PathVariable Long reviewId) {

        if (authentication == null) {
            throw new RuntimeException("No authentication");
        }

        CustomUserDetails userDetails =
                (CustomUserDetails) authentication.getPrincipal();
        reviewService.deleteReview(userDetails.getId(), reviewId);
    }

    @GetMapping("/review/summary/{courseId}")
    public RatingSummaryResponse getRatingSummary(@PathVariable Long courseId) {
        return reviewService.getRatingSummary(courseId);
    }

    @GetMapping("/review/testimonials")
    public List<TestimonialResponse> getPlatformTestimonials() {
        return reviewService.getPlatformTestimonials(6);
    }
}
