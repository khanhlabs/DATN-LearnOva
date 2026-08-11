package com.example.back_end.assessment.adapter.in.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record SubmitQuizRequest(
        @NotEmpty List<@Valid QuizAnswerRequest> answers
) {
    public record QuizAnswerRequest(
            @NotNull Long questionId,
            Long selectedOptionId
    ) {
    }
}
