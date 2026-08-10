package com.example.back_end.user.adapter.in.web.dto;

public record UserStatsResponse(
        double totalStudyHours,
        int streakDays,
        int enrolledCourseCount,
        int completedCourseCount,
        int points
) {
}
