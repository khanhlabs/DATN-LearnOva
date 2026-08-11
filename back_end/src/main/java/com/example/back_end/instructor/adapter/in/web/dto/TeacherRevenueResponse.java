package com.example.back_end.instructor.adapter.in.web.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record TeacherRevenueResponse(
        BigDecimal revenueTotal,
        Double revenueDeltaPercent,
        BigDecimal lifetimeRevenue,
        long newStudents,
        Double studentsDeltaPercent,
        long ordersCount,
        Double ordersDeltaPercent,
        BigDecimal avgOrderValue,
        double avgRating,
        List<RevenuePoint> revenueByDay,
        List<RevenuePoint> previousRevenueByDay,
        HighestRevenueDay highestRevenueDay,
        BigDecimal totalRefunds,
        Double refundsPercentOfOrders,
        List<TopRevenueCourse> topCourses,
        List<Transaction> transactions
) {
    public record RevenuePoint(LocalDate day, BigDecimal amount) {}

    public record HighestRevenueDay(LocalDate day, BigDecimal amount) {}

    public record TopRevenueCourse(
            Long courseId,
            String title,
            String thumbnailKey,
            BigDecimal revenue,
            long studentCount
    ) {}

    public record Transaction(
            Long orderId,
            String studentName,
            String studentAvatar,
            String courseTitle,
            BigDecimal amount,
            String paymentMethod,
            Instant paidAt
    ) {}
}
