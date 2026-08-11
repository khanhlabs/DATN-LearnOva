package com.example.back_end.assessment.adapter.in.web.dto;

import java.util.List;

public record QuizResponse(
        Long quizId,
        Long lessonId,
        List<QuizQuestionResponse> questions
) {
}
