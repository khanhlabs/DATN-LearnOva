package com.example.back_end.instructor.adapter.in.web.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record TeacherDashboardResponse(
        long totalStudents,
        double avgRating,
        long ratingCount,
        double completionRate,
        BigDecimal revenueTotal,
        Double revenueDeltaPercent,
        long newStudentsThisMonth,
        Double studentsDeltaPercent,
        List<RevenuePoint> revenueByDay,
        List<GrowthPoint> studentGrowth,
        List<RecentEnrollment> recentEnrollments,
        List<TopCourseRow> topCourses,
        AttentionSummary attention,
        CourseStatusCounts courseStatusCounts
) {
    public record RevenuePoint(LocalDate day, BigDecimal amount) {}

    public record GrowthPoint(LocalDate day, long cumulativeStudents) {}

    public record RecentEnrollment(
            Long studentId,
            String studentName,
            String studentAvatar,
            Long courseId,
            String courseTitle,
            Instant enrolledAt
    ) {}

    public record TopCourseRow(
            Long courseId,
            String title,
            String thumbnailKey,
            String categoryName,
            double avgRating,
            long ratingCount,
            long studentCount,
            BigDecimal revenue,
            double completionRate
    ) {}

    public record RejectedCourseInfo(Long courseId, String title, String reason) {}

    public record PendingReviewCourseInfo(Long courseId, String title) {}

    public record AttentionSummary(
            RejectedCourseInfo rejectedCourse,
            PendingReviewCourseInfo pendingReviewCourse,
            long newReviewCount,
            long pendingQaCount
    ) {}

    public record CourseStatusCounts(
            long published,
            long draft,
            long pendingReview,
            long rejected,
            long deleted
    ) {}
}
