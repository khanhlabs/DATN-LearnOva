package com.example.back_end.learning.adapter.in.web.dto;

import java.time.Instant;

public record LessonSummaryResponse(
        Long lessonId,
        String content,
        Instant updatedAt
) {
}
