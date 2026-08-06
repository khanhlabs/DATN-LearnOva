package com.example.back_end.dto.response.admin;

public record AdminVoucherOverviewResponse(
        long totalVouchers,
        Double totalVouchersDeltaPercent,
        long activeVouchers,
        long expiredVouchers,
        long appliedUses,
        Double conversionRatePercent
) {}
