package com.example.back_end.instructor.adapter.in.web;

import com.example.back_end.instructor.adapter.in.web.dto.CreateDraftCourseRequest;
import com.example.back_end.instructor.adapter.in.web.dto.UpdateCourseRequest;
import com.example.back_end.instructor.adapter.in.web.dto.UpdateCourseStatusRequest;
import com.example.back_end.instructor.adapter.in.web.dto.CreateDraftCourseResponse;
import com.example.back_end.instructor.adapter.in.web.dto.TeacherCoursesResponse;
import com.example.back_end.instructor.application.TeacherCourseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/learnova/teacher/courses")
@RequiredArgsConstructor
@PreAuthorize("hasRole('TEACHER')")
public class TeacherCourseController {

    private final TeacherCourseService teacherCourseService;

    @GetMapping
    public ResponseEntity<List<TeacherCoursesResponse>> getMyCourses(Authentication authentication) {
        return ResponseEntity.ok(teacherCourseService.getMyCourses(authentication.getName()));
    }

    @PostMapping
    public CreateDraftCourseResponse createDraftCourse(
            @Valid @RequestBody CreateDraftCourseRequest request,
            Authentication authentication
    ) {
        Long courseId = teacherCourseService.createDraftCourse(request, authentication.getName());
        return new CreateDraftCourseResponse(courseId);
    }

    @PutMapping("/{courseId}")
    public ResponseEntity<Void> updateCourse(
            @PathVariable Long courseId,
            @Valid @RequestBody UpdateCourseRequest request,
            Authentication authentication
    ) {
        teacherCourseService.updateCourse(courseId, request, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{courseId}/status")
    public ResponseEntity<Void> updateCourseStatus(
            @PathVariable Long courseId,
            @Valid @RequestBody UpdateCourseStatusRequest request,
            Authentication authentication
    ) {
        teacherCourseService.updateCourseStatus(courseId, authentication.getName(), request.status());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{courseId}/visibility")
    public ResponseEntity<Void> toggleCourseVisibility(
            @PathVariable Long courseId,
            Authentication authentication
    ) {
        teacherCourseService.toggleCourseVisibility(courseId, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{courseId}")
    public ResponseEntity<Void> softDeleteCourse(
            @PathVariable Long courseId,
            Authentication authentication
    ) {
        teacherCourseService.softDeleteCourse(courseId, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
