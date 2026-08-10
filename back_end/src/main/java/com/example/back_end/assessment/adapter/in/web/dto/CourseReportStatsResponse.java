package com.example.back_end.assessment.adapter.in.web.dto;

public record CourseReportStatsResponse(
        long openReports,
        long reportedCourses,
        long hiddenByModeration,
        long resolvedCases
) {
}
