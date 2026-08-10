package com.example.back_end.assessment.adapter.in.web.dto;
import com.example.back_end.course.domain.Lesson;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class CreateQuestionRequest {

    @NotNull(message = "Lesson ID is required")
    @Positive(message = "Lesson ID must be a positive number")
    private Long lessonId;

    @NotBlank(message = "Question content is required")
    private String content;
}
