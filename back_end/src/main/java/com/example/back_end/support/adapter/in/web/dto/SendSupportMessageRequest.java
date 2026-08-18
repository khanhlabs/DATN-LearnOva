package com.example.back_end.support.adapter.in.web.dto;

public record SendSupportMessageRequest(
        String content,
        String attachmentKey,
        String attachmentName,
        String attachmentContentType
) {}
