package com.example.back_end.course.adapter.in.web.dto;

public record PlatformStatsResponse(
        long totalLearners,
        long totalCourses,
        double avgRating
) {}
