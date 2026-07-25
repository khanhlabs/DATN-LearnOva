package com.example.back_end.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

public record PublicInstructorDetailResponse(
        Long instructorId,
        String fullName,
        String avatar,
        String headline,
        String description,
        List<String> expertiseTags,
        Map<String, String> socialLinks,
        double rating,
        long reviewCount,
        long studentCount,
        long courseCount,
        long followerCount,
        List<CourseSummary> courses,
        List<ReviewSummary> reviews
) {
    public record CourseSummary(
            Long courseId,
            String title,
            String thumbnailKey,
            BigDecimal basePrice,
            double rating,
            long reviewCount,
            long studentCount
    ) {}

    public record ReviewSummary(
            String reviewerName,
            String reviewerAvatar,
            int rating,
            String comment,
            Instant createdAt,
            String courseTitle
    ) {}
}
