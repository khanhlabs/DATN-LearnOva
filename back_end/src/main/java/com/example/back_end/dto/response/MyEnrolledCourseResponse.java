package com.example.back_end.dto.response;

import com.example.back_end.entity.enums.CourseLevel;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;

public record MyEnrolledCourseResponse(
        Long courseId,
        String title,
        String description,
        List<String> whatYouLearn,
        String categoryName,
        List<String> tags,
        String instructorName,
        String instructorAvatar,
        String instructorHeadline,
        String instructorDescription,
        Long instructorCourseCount,
        Long instructorStudentCount,
        Double instructorRating,
        CourseLevel level,
        String thumbnailKey,
        Integer progressPercent,

        Integer totalLessons,
        Integer completedLessons,
        Long totalDurationSeconds,
        Double averageRating,
        Long reviewCount,
        Long studentCount,

        Instant enrolledAt,
        OffsetDateTime completedAt,
        Instant updatedAt
) {}
