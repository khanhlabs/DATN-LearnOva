package com.example.back_end.commerce.adapter.in.web.dto;

import java.math.BigDecimal;

public record ApplyVoucherResponse(
        Long voucherId,
        String code,
        String discountType,
        BigDecimal discountValue,
        BigDecimal discountAmount,
        BigDecimal subtotal,
        BigDecimal total,
        Integer usageLimit,
        Integer usedCount,
        Boolean isActive
) {}
