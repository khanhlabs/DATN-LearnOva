package com.example.back_end.commerce.adapter.in.web.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record UserVoucherResponse(
        Long id,
        Long voucherId,
        String code,
        String description,
        String discountType,
        BigDecimal discountValue,
        BigDecimal minimumOrder,
        BigDecimal maximumDiscountAmount,
        Integer usageLimit,
        Integer usedCount,
        OffsetDateTime startDate,
        OffsetDateTime endDate,
        Boolean isActive,
        boolean claimed,
        OffsetDateTime claimedAt,
        String status
) {}
