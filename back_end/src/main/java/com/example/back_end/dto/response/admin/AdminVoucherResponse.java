package com.example.back_end.dto.response.admin;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.OffsetDateTime;



public record AdminVoucherResponse(
    Long id,
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
    Long createdById,
    Instant createdAt,
    Instant updatedAt
) {}
