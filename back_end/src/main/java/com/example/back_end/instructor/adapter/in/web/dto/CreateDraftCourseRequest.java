package com.example.back_end.instructor.adapter.in.web.dto;

import com.example.back_end.course.domain.enums.CourseLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public record CreateDraftCourseRequest(
        @NotBlank String title,
        @NotBlank String description,
        @NotBlank String language,
        @NotNull CourseLevel level,
        @NotNull BigDecimal basePrice,
        String thumbnailKey,
        List<String> requirements,
        List<String> whatYouLearn,
        Long categoryId
) {
}