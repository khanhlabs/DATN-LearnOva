package com.example.back_end.assessment.adapter.in.web.dto;

import java.util.List;

public record QuizResultResponse(
        Long attemptId,
        Integer score,
        Integer totalQuestions,
        List<QuizAnswerResult> answers
) {
    public record QuizAnswerResult(
            Long questionId,
            Long selectedOptionId,
            Long correctOptionId,
            boolean correct
    ) {
    }
}
