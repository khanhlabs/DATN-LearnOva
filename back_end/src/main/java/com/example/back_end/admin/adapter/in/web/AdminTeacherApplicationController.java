package com.example.back_end.admin.adapter.in.web;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.back_end.admin.adapter.in.web.dto.RejectTeacherApplicationRequest;
import com.example.back_end.media.adapter.in.web.dto.CvUrlResponse;
import com.example.back_end.instructor.adapter.in.web.dto.TeacherApplicationResponse;
import com.example.back_end.admin.application.AdminTeacherApplicationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/learnova/admin/teacher-applications")
public class AdminTeacherApplicationController {

    private final AdminTeacherApplicationService adminTeacherApplicationService;

    @GetMapping
    public ResponseEntity<List<TeacherApplicationResponse>> listPending() {
        return ResponseEntity.ok(adminTeacherApplicationService.listPending());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TeacherApplicationResponse> getDetail(@PathVariable Long id) {
        return ResponseEntity.ok(adminTeacherApplicationService.getById(id));
    }

    @GetMapping("/{id}/cv-url")
    public ResponseEntity<CvUrlResponse> getCvUrl(@PathVariable Long id) {
        return ResponseEntity.ok(adminTeacherApplicationService.getCvUrl(id));
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<TeacherApplicationResponse> approve(@PathVariable Long id) {
        return ResponseEntity.ok(adminTeacherApplicationService.approve(id));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<TeacherApplicationResponse> reject(
            @PathVariable Long id,
            @Valid @RequestBody RejectTeacherApplicationRequest request
    ) {
        return ResponseEntity.ok(adminTeacherApplicationService.reject(id, request.reason()));
    }
}
