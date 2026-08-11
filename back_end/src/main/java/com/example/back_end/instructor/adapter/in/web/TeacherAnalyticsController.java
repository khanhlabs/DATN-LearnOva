package com.example.back_end.instructor.adapter.in.web;

import com.example.back_end.instructor.adapter.in.web.dto.TeacherAnalyticsResponse;
import com.example.back_end.instructor.application.TeacherAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/learnova/teacher/analytics")
@PreAuthorize("hasRole('TEACHER')")
public class TeacherAnalyticsController {

    private final TeacherAnalyticsService teacherAnalyticsService;

    @GetMapping
    public ResponseEntity<TeacherAnalyticsResponse> getAnalytics(Authentication authentication) {
        return ResponseEntity.ok(teacherAnalyticsService.getAnalytics(authentication.getName()));
    }
}
