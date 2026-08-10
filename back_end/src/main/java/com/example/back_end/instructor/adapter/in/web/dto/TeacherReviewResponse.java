package com.example.back_end.instructor.adapter.in.web.dto;

import java.time.Instant;
import java.time.OffsetDateTime;

public record TeacherReviewResponse(
        Long reviewId,
        Long courseId,
        String courseTitle,
        Long userId,
        String userName,
        String avatar,
        Integer rating,
        String comment,
        String instructorReply,
        OffsetDateTime repliedAt,
        Instant createdAt,
        Instant updatedAt
) {}
