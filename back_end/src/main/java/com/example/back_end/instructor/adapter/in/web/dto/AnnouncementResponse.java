package com.example.back_end.instructor.adapter.in.web.dto;

import java.time.Instant;

public record AnnouncementResponse(
        Long id,
        Long courseId,
        String courseTitle,
        String title,
        String content,
        int recipientCount,
        Instant createdAt
) {
}
