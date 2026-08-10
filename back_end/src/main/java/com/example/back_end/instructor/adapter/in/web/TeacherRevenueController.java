package com.example.back_end.instructor.adapter.in.web;

import com.example.back_end.instructor.adapter.in.web.dto.TeacherRevenueResponse;
import com.example.back_end.instructor.application.TeacherRevenueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/learnova/teacher/revenue")
@PreAuthorize("hasRole('TEACHER')")
public class TeacherRevenueController {

    private final TeacherRevenueService teacherRevenueService;

    @GetMapping
    public ResponseEntity<TeacherRevenueResponse> getRevenue(Authentication authentication) {
        return ResponseEntity.ok(teacherRevenueService.getRevenue(authentication.getName()));
    }
}
