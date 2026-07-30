package com.example.back_end.dto.response;

import java.math.BigDecimal;

public record PaymentHistoryItemResponse(
        Long courseId,
        String courseTitle,
        BigDecimal originalPrice,
        BigDecimal price
) {}
