package com.example.back_end.assessment.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CourseReportRequest(
        @NotNull Long courseId,
        @NotBlank String reason,
        @Size(max = 500) String description,
        Long lessonId
) {
}
