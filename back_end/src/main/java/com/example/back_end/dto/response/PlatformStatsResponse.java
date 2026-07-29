package com.example.back_end.dto.response;

public record PlatformStatsResponse(
        long totalLearners,
        long totalCourses,
        double avgRating
) {}
