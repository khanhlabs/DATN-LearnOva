package com.example.back_end.instructor.adapter.in.web.dto;

import com.example.back_end.course.domain.enums.CourseStatus;
import java.math.BigDecimal;
import java.time.Instant;

public record TeacherCoursesResponse(
        Long courseId,
        String title,
        String thumbnailKey,
        CourseStatus status,
        BigDecimal basePrice,
        Instant createdAt,
        Instant updatedAt,
        String categoryName,
        long lessonCount,
        long totalDurationSeconds,
        long studentCount,
        Boolean isDeleted,
        Boolean isHidden,
        String rejectionReason,
        double avgRating,
        long ratingCount
) {
}
