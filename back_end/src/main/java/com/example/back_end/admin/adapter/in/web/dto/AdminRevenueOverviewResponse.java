package com.example.back_end.admin.adapter.in.web.dto;

import java.math.BigDecimal;
import java.util.List;

public record AdminRevenueOverviewResponse(
        Kpis kpis,
        List<CategoryBreakdownItem> categoryBreakdown
) {
    public record Kpis(
            BigDecimal totalRevenue,
            Double totalRevenueDeltaPercent,
            BigDecimal monthlyRevenue,
            Double monthlyRevenueDeltaPercent,
            long totalTransactions,
            Double totalTransactionsDeltaPercent,
            long refundCount,
            Double refundDeltaPercent,
            Double growthRatePercent,
            BigDecimal pendingPayoutAmount,
            long pendingPayoutCount
    ) {}

    public record CategoryBreakdownItem(
            Long categoryId,
            String categoryName,
            BigDecimal amount,
            BigDecimal sharePercent
    ) {}
}
