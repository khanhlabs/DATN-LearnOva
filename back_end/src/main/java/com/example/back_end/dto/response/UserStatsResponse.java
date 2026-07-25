package com.example.back_end.dto.response;

public record UserStatsResponse(
        double totalStudyHours,
        int streakDays,
        int enrolledCourseCount,
        int completedCourseCount,
        int points
) {
}
