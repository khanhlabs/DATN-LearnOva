package com.example.back_end.ai.adapter.in.web.dto;

import com.example.back_end.ai.domain.AiGenerationStatus;
import com.example.back_end.ai.domain.AiGenerationType;

import java.time.Instant;

public record AiGenerationJobStatusResponse(
        AiGenerationType type,
        AiGenerationStatus status,
        Integer attempts,
        Instant updatedAt
) {
}
