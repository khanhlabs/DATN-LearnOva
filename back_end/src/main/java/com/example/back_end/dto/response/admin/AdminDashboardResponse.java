package com.example.back_end.dto.response.admin;

import java.math.BigDecimal;
import java.util.List;

public record AdminDashboardResponse(
        Statistics statistics,
        List<GrowthPoint> growthSeries,
        List<RoleDistributionItem> roleDistribution,
        List<RecentUser> recentUsers,
        List<FeaturedInstructor> featuredInstructors,
        List<ActivityItem> recentActivity
) {
    public record Statistics(
            long totalUsers,
            long totalTeachers,
            long totalCourses,
            BigDecimal totalRevenue
    ) {
    }

    public record GrowthPoint(
            String month,
            long value
    ) {
    }

    public record RoleDistributionItem(
            String name,
            long count
    ) {
    }

    public record RecentUser(
            Long id,
            String name,
            String email,
            String role
    ) {
    }

    public record FeaturedInstructor(
            Long id,
            String name,
            long courses,
            double rating,
            int rank,
            String avatar
    ) {
    }

    public record ActivityItem(
            String id,
            String label,
            String title,
            String time
    ) {
    }
}
