package com.example.back_end.admin.adapter.in.web.dto;

public record AdminVoucherOverviewResponse(
        long totalVouchers,
        Double totalVouchersDeltaPercent,
        long activeVouchers,
        long expiredVouchers,
        long appliedUses,
        Double conversionRatePercent
) {}
