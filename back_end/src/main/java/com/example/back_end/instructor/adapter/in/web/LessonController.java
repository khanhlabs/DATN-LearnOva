package com.example.back_end.instructor.adapter.in.web;

import com.example.back_end.instructor.adapter.in.web.dto.CreateLessonResponse;
import com.example.back_end.instructor.adapter.in.web.dto.CreateLessonRequest;
import com.example.back_end.instructor.adapter.in.web.dto.UpdateLessonRequest;
import com.example.back_end.instructor.adapter.in.web.dto.UpdateLessonVideoRequest;
import com.example.back_end.instructor.application.LessonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/learnova/teacher/courses")
@PreAuthorize("hasRole('TEACHER')")
public class LessonController {

    private final LessonService lessonService;

    @PostMapping("/sections/{sectionId}/lessons")
    public CreateLessonResponse createLesson(
            @PathVariable Long sectionId,
            @Valid @RequestBody CreateLessonRequest request,
            Authentication authentication
    ) {
        Long lessonId = lessonService.createLesson(
                sectionId,
                request,
                authentication.getName()
        );

        return new CreateLessonResponse(lessonId);
    }

    @PutMapping("/lessons/{lessonId}")
    public void updateLesson(
            @PathVariable Long lessonId,
            @RequestBody UpdateLessonRequest request,
            Authentication authentication
    ) {
        lessonService.updateLesson(lessonId, request, authentication.getName());
    }

    @PutMapping("/lessons/{lessonId}/video")
    public void updateLessonVideo(
            @PathVariable Long lessonId,
            @RequestBody UpdateLessonVideoRequest request,
            Authentication authentication
    ) {
        lessonService.updateLessonVideo(lessonId, request, authentication.getName());
    }

}
