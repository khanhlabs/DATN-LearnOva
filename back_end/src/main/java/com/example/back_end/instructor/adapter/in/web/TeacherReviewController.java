package com.example.back_end.instructor.adapter.in.web;

import com.example.back_end.instructor.adapter.in.web.dto.ReplyReviewRequest;
import com.example.back_end.instructor.adapter.in.web.dto.TeacherReviewResponse;
import com.example.back_end.instructor.application.TeacherReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/learnova/teacher/reviews")
@RequiredArgsConstructor
@PreAuthorize("hasRole('TEACHER')")
public class TeacherReviewController {

    private final TeacherReviewService teacherReviewService;

    @GetMapping
    public ResponseEntity<List<TeacherReviewResponse>> getMyReviews(Authentication authentication) {
        return ResponseEntity.ok(teacherReviewService.getMyReviews(authentication.getName()));
    }

    @PatchMapping("/{reviewId}/reply")
    public ResponseEntity<Void> replyToReview(
            @PathVariable Long reviewId,
            @Valid @RequestBody ReplyReviewRequest request,
            Authentication authentication
    ) {
        teacherReviewService.replyToReview(reviewId, authentication.getName(), request.reply());
        return ResponseEntity.noContent().build();
    }
}
