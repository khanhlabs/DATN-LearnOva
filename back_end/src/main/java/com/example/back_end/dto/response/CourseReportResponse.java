package com.example.back_end.dto.response;

import java.time.Instant;

public record CourseReportResponse(
        Long id,
        String reportCode,
        String reportKey,
        Long courseId,
        String courseTitle,
        Boolean courseHidden,
        Long lessonId,
        String lessonTitle,
        Long reporterId,
        String reporterName,
        String reason,
        String description,
        String status,
        long reportCount,
        String adminNote,
        Instant createdAt,
        Instant resolvedAt,
        /** HIGH for SENSITIVE_CONTENT / COPYRIGHT; otherwise NORMAL. Stored in metadata, not a new column. */
        String severity,
        /** Unique reports with same course + reason (+ lesson when present). */
        long sameReasonCount,
        Boolean instructorWarned,
        Boolean lessonDeleted,
        /** True when high-severity + sameReasonCount >= 2 + lesson still exists. */
        Boolean canDeleteLesson
) {
}
