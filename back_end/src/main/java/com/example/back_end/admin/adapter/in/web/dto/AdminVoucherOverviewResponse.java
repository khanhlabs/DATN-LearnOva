package com.example.back_end.admin.adapter.in.web.dto;

import java.math.BigDecimal;

public record AdminVoucherOverviewResponse(
        long totalVouchers,
        Double totalVouchersDeltaPercent,
        long activeVouchers,
        long expiredVouchers,
        long appliedUses,
        BigDecimal totalDiscountedAmount,
        Double conversionRatePercent
) {}
