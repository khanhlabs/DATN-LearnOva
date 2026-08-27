package com.example.back_end.learning.adapter.in.web;

import com.example.back_end.learning.adapter.in.web.dto.CourseProgressResponse;
import com.example.back_end.learning.adapter.in.web.dto.LessonProgressRequest;
import com.example.back_end.security.CustomUserDetails;
import com.example.back_end.learning.application.LessonProgressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/learnova/progress")
@RequiredArgsConstructor
public class ProgressController {

    private final LessonProgressService lessonProgressService;

    @PostMapping("/update")
    public ResponseEntity<CourseProgressResponse> updateProgress(
            Authentication authentication,
            @Valid @RequestBody LessonProgressRequest request
    ) {
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            return ResponseEntity.status(401).build();
        }
        CourseProgressResponse response = lessonProgressService.updateProgress(userDetails.getId(), request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/course/{courseId}/restart")
    public ResponseEntity<CourseProgressResponse> restartCourse(
            Authentication authentication,
            @PathVariable Long courseId
    ) {
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(lessonProgressService.restartCourse(userDetails.getId(), courseId));
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<CourseProgressResponse> getCourseProgress(
            Authentication authentication,
            @PathVariable Long courseId
    ) {
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            return ResponseEntity.status(401).build();
        }
        CourseProgressResponse response = lessonProgressService.getCourseProgress(userDetails.getId(), courseId);
        return ResponseEntity.ok(response);
    }
}
