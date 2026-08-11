package com.example.back_end.notification.adapter.in.web.dto;

import java.time.Instant;

public record NotificationResponse(
        Long id,
        String type,
        String title,
        String content,
        Boolean isRead,
        String link,
        Instant createdAt
) {
}
