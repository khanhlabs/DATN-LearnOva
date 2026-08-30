package com.example.back_end.instructor.adapter.in.web;

import com.example.back_end.instructor.adapter.in.web.dto.TeacherEarningsResponse;
import com.example.back_end.instructor.application.TeacherEarningsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/learnova/teacher/earnings")
@PreAuthorize("hasRole('TEACHER')")
public class TeacherEarningsController {

    private final TeacherEarningsService teacherEarningsService;

    @GetMapping
    public ResponseEntity<TeacherEarningsResponse> getEarnings(Authentication authentication) {
        return ResponseEntity.ok(teacherEarningsService.getEarnings(authentication.getName()));
    }

    @GetMapping("/{orderItemId}")
    public ResponseEntity<TeacherEarningsResponse.EarningItem> getEarningDetail(
            Authentication authentication,
            @PathVariable Long orderItemId
    ) {
        return ResponseEntity.ok(
                teacherEarningsService.getEarningDetail(authentication.getName(), orderItemId)
        );
    }
}