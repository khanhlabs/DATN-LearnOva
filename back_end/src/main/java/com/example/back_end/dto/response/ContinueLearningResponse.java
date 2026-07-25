package com.example.back_end.dto.response;

public record ContinueLearningResponse(
        Long courseId,
        String title,
        String thumbnailKey,
        int progressPercent,
        int completedLessons,
        int totalLessons
) {}
