package com.example.back_end.learning.adapter.in.web.dto;

public record ContinueLearningResponse(
        Long courseId,
        String title,
        String thumbnailKey,
        int progressPercent,
        int completedLessons,
        int totalLessons
) {}
