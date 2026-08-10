package com.example.back_end.instructor.adapter.in.web;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.back_end.instructor.adapter.in.web.dto.CreateTeacherApplicationRequest;
import com.example.back_end.media.adapter.in.web.dto.CvUrlResponse;
import com.example.back_end.instructor.adapter.in.web.dto.TeacherApplicationResponse;
import com.example.back_end.instructor.application.TeacherApplicationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/learnova/teacher/applications")
public class TeacherApplicationController {

    private final TeacherApplicationService teacherApplicationService;

    @PostMapping
    public ResponseEntity<TeacherApplicationResponse> submit(
            Authentication authentication,
            @Valid @RequestBody CreateTeacherApplicationRequest request
    ) {
        return ResponseEntity.ok(
                teacherApplicationService.submit(authentication.getName(), request)
        );
    }

    @GetMapping("/me")
    public ResponseEntity<List<TeacherApplicationResponse>> getMine(Authentication authentication) {
        return ResponseEntity.ok(
                teacherApplicationService.getMyApplications(authentication.getName())
        );
    }

    @GetMapping("/{id}/cv-url")
    public ResponseEntity<CvUrlResponse> getMyCvUrl(Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(
                teacherApplicationService.getMyCvUrl(id, authentication.getName())
        );
    }
}
