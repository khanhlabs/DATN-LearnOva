package com.example.back_end.instructor.adapter.in.web;

import com.example.back_end.instructor.adapter.in.web.dto.CreateLessonSourceRequest;
import com.example.back_end.instructor.adapter.in.web.dto.LessonSourceResponse;
import com.example.back_end.instructor.application.LessonSourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/learnova/teacher/courses")
@PreAuthorize("hasRole('TEACHER')")
public class LessonSourceController {

    private final LessonSourceService lessonSourceService;

    @PostMapping("/lessons/{lessonId}/sources")
    public LessonSourceResponse createLessonSource(
            @PathVariable Long lessonId,
            @RequestBody CreateLessonSourceRequest request,
            Authentication authentication
    ) {
        return lessonSourceService.createLessonSource(lessonId, request, authentication.getName());
    }

    @GetMapping("/lessons/{lessonId}/sources")
    public List<LessonSourceResponse> getLessonSources(@PathVariable Long lessonId, Authentication authentication) {
        return lessonSourceService.getLessonSources(lessonId, authentication.getName());
    }

    @DeleteMapping("/sources/{sourceId}")
    public void deleteLessonSource(@PathVariable Long sourceId, Authentication authentication) {
        lessonSourceService.deleteLessonSource(sourceId, authentication.getName());
    }
}
