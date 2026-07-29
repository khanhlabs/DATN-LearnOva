package com.example.back_end.dto.response;

public record CourseReportStatsResponse(
        long openReports,
        long reportedCourses,
        long hiddenByModeration,
        long resolvedCases
) {
}
