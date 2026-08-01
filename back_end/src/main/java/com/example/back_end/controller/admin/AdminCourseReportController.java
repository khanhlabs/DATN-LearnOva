package com.example.back_end.controller.admin;

import com.example.back_end.dto.request.WarnInstructorRequest;
import com.example.back_end.dto.response.CourseReportResponse;
import com.example.back_end.dto.response.CourseReportStatsResponse;
import com.example.back_end.security.CustomUserDetails;
import com.example.back_end.service.CourseReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/learnova/admin/reports")
public class AdminCourseReportController {

    private final CourseReportService courseReportService;

    @GetMapping
    public ResponseEntity<List<CourseReportResponse>> listAll() {
        return ResponseEntity.ok(courseReportService.listAll());
    }

    @GetMapping("/stats")
    public ResponseEntity<CourseReportStatsResponse> getStats() {
        return ResponseEntity.ok(courseReportService.getStats());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourseReportResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(courseReportService.getById(id));
    }

    @PatchMapping("/{id}/dismiss")
    public ResponseEntity<CourseReportResponse> dismiss(
            Authentication authentication,
            @PathVariable Long id
    ) {
        CustomUserDetails admin = (CustomUserDetails) authentication.getPrincipal();
        return ResponseEntity.ok(courseReportService.dismiss(id, admin.getId()));
    }

    @PatchMapping("/{id}/resolve")
    public ResponseEntity<CourseReportResponse> resolve(
            Authentication authentication,
            @PathVariable Long id
    ) {
        CustomUserDetails admin = (CustomUserDetails) authentication.getPrincipal();
        return ResponseEntity.ok(courseReportService.resolve(id, admin.getId()));
    }

    @PatchMapping("/{id}/hide-course")
    public ResponseEntity<CourseReportResponse> hideCourse(
            Authentication authentication,
            @PathVariable Long id
    ) {
        CustomUserDetails admin = (CustomUserDetails) authentication.getPrincipal();
        return ResponseEntity.ok(courseReportService.hideCourse(id, admin.getId()));
    }

    @PatchMapping("/{id}/warn-instructor")
    public ResponseEntity<CourseReportResponse> warnInstructor(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody(required = false) WarnInstructorRequest request
    ) {
        CustomUserDetails admin = (CustomUserDetails) authentication.getPrincipal();
        String message = request == null ? null : request.message();
        return ResponseEntity.ok(courseReportService.warnInstructor(id, admin.getId(), message));
    }

    @PatchMapping("/{id}/delete-lesson")
    public ResponseEntity<CourseReportResponse> deleteLesson(
            Authentication authentication,
            @PathVariable Long id
    ) {
        CustomUserDetails admin = (CustomUserDetails) authentication.getPrincipal();
        return ResponseEntity.ok(courseReportService.deleteReportedLesson(id, admin.getId()));
    }
}
