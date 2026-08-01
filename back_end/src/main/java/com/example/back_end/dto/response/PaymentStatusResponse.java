package com.example.back_end.dto.response;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record PaymentStatusResponse(
        Long orderId,
        Long paymentId,
        String orderStatus,
        String paymentStatus,
        OffsetDateTime paidAt,
        Long courseId,
        String courseTitle,
        List<String> courseTitles,
        BigDecimal totalAmount,
        BigDecimal totalUsd,
        Long amountVnd
) {}
