package com.example.back_end.commerce.adapter.in.web.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record CreatePaymentResponse(
        Long orderId,
        Long paymentId,
        Long courseId,
        String courseTitle,
        List<String> courseTitles,
        BigDecimal subtotal,
        BigDecimal discountAmount,
        BigDecimal totalAmount,
        BigDecimal totalUsd,
        Long amountVnd,
        BigDecimal exchangeRate,
        String paymentMethod,
        String paymentStatus,
        String orderStatus,
        String checkoutUrl,
        String qrCode,
        String paymentLinkId,
        OffsetDateTime expiresAt
) {}
