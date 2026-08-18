package com.example.back_end.support.adapter.in.web.dto;

import com.example.back_end.support.domain.enums.SupportMessageSenderType;

import java.time.Instant;

public record SupportMessageResponse(
        Long id,
        Long conversationId,
        Long senderId,
        String senderName,
        SupportMessageSenderType senderType,
        String content,
        String attachmentUrl,
        String attachmentName,
        String attachmentContentType,
        Instant createdAt
) {}
