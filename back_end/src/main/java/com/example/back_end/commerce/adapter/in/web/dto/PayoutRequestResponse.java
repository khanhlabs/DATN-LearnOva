package com.example.back_end.commerce.adapter.in.web.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record PayoutRequestResponse(
        Long id,
        Long teacherId,
        String teacherName,
        String teacherEmail,
        BigDecimal amount,
        String status,
        String notes,
        String rejectionReason,
        Instant createdAt,
        Instant processedAt
) {
}
