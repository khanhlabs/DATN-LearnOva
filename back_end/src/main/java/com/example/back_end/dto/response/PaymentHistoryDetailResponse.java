package com.example.back_end.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;

public record PaymentHistoryDetailResponse(
        Long orderId,
        Long paymentId,
        Instant createdAt,
        OffsetDateTime paidAt,
        String fullName,
        String email,
        String phone,
        List<PaymentHistoryItemResponse> items,
        String voucherCode,
        BigDecimal subtotal,
        BigDecimal discountAmount,
        BigDecimal totalUsd,
        BigDecimal amountVnd,
        String currency,
        String paymentMethod,
        String orderStatus,
        String paymentStatus,
        String transactionId
) {}
