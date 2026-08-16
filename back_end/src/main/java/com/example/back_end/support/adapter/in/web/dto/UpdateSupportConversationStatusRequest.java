package com.example.back_end.support.adapter.in.web.dto;

import com.example.back_end.support.domain.enums.SupportConversationStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateSupportConversationStatusRequest(@NotNull SupportConversationStatus status) {}
