package com.example.back_end.commerce.adapter.in.web.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;

public record PaymentHistoryResponse(
        Long orderId,
        Long paymentId,
        Instant createdAt,
        OffsetDateTime paidAt,
        List<String> courseTitles,
        BigDecimal totalUsd,
        BigDecimal amountVnd,
        String currency,
        String paymentMethod,
        String orderStatus,
        String paymentStatus,
        String transactionId
) {}
