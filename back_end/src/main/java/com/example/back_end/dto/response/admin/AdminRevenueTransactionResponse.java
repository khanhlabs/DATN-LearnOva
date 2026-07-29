package com.example.back_end.dto.response.admin;

import java.math.BigDecimal;
import java.time.Instant;

public record AdminRevenueTransactionResponse(
        Long orderId,
        Long paymentId,
        Long orderItemId,
        String transactionId,
        String studentName,
        String courseName,
        Long categoryId,
        String categoryName,
        String paymentMethod,
        BigDecimal amount,
        String currency,
        String status,
        Instant paidAt
) {}
