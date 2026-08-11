package com.example.back_end.instructor.adapter.in.web.dto;
import com.example.back_end.course.domain.Lesson;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreateLessonRequest(
        @NotBlank(message = "Lesson title is required")
        String title,

        @NotNull(message = "Lesson order is required")
        @Positive(message = "Lesson order must be a positive number")
        Integer lessonOrder,

        Boolean isPreview
) {
}
