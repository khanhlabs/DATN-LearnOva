package com.example.back_end.support.adapter.in.web.dto;

import com.example.back_end.support.domain.enums.SupportConversationStatus;

import java.time.Instant;

public record SupportConversationResponse(
        Long id,
        Long userId,
        String userName,
        String userEmail,
        Long assignedAdminId,
        String subject,
        SupportConversationStatus status,
        Instant createdAt,
        Instant updatedAt,
        SupportMessageResponse lastMessage,
        boolean unreadForAdmin
) {}
