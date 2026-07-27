package com.example.back_end.dto.response.admin;

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
            BigDecimal pendingPayoutAmount,
            long pendingPayoutCount,
            long refundCount,
            Double refundDeltaPercent,
            Double growthRatePercent
    ) {}

    public record CategoryBreakdownItem(
            Long categoryId,
            String categoryName,
            BigDecimal amount,
            BigDecimal sharePercent
    ) {}
}
