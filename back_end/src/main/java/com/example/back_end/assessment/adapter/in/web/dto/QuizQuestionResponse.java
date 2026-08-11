package com.example.back_end.assessment.adapter.in.web.dto;

import java.util.List;

public record QuizQuestionResponse(
        Long questionId,
        String questionText,
        List<QuizOptionResponse> options
) {
}
