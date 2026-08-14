package com.example.back_end.commerce.adapter.in.web.dto;

import java.math.BigDecimal;

public record PaymentHistoryItemResponse(
        Long courseId,
        String courseTitle,
        BigDecimal originalPrice,
        BigDecimal price
) {}
