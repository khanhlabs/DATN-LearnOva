package com.example.back_end.instructor.adapter.in.web;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.back_end.instructor.adapter.in.web.dto.CreateSectionResponse;
import com.example.back_end.instructor.adapter.in.web.dto.CreateSectionRequest;
import com.example.back_end.instructor.adapter.in.web.dto.UpdateSectionRequest;
import com.example.back_end.instructor.application.SectionService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/learnova/teacher/courses")
@PreAuthorize("hasRole('TEACHER')")
public class SectionController {

    private final SectionService sectionService;

    @PostMapping("/{courseId}/sections")
    public CreateSectionResponse createSection(
            @PathVariable Long courseId,
            @RequestBody @Valid CreateSectionRequest request,
            Authentication authentication
    ) {
        Long sectionId = sectionService.createSection(
                courseId,
                request,
                authentication.getName()
        );

        return new CreateSectionResponse(sectionId);
    }

    @PutMapping("/sections/{sectionId}")
    public void updateSection(
            @PathVariable Long sectionId,
            @RequestBody @Valid UpdateSectionRequest request,
            Authentication authentication
    ) {
        sectionService.updateSection(sectionId, request, authentication.getName());
    }

}
