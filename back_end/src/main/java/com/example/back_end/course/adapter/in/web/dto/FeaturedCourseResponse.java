package com.example.back_end.course.adapter.in.web.dto;

import com.example.back_end.course.domain.enums.CourseLevel;

import java.math.BigDecimal;

public record FeaturedCourseResponse(
        Long courseId,
        String title,
        String thumbnailKey,
        String instructorName,
        BigDecimal basePrice,
        Integer discountPercent,
        long studentCount,
        long lessonCount,
        long totalDurationSeconds,
        String categoryName,
        CourseLevel level,
        double rating
) {
}
