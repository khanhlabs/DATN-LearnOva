package com.example.back_end.support.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateSupportConversationRequest(
        @NotBlank String subject,
        String initialMessage
) {}
