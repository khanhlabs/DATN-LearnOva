package com.example.back_end.dto.response.admin;

import java.math.BigDecimal;
import java.util.List;

public record AdminRevenueTransactionInsightsResponse(
        List<CategoryMetric> categoryMetrics,
        PeakDayRecord peakDay,
        PeakMonthRecord peakMonth
) {
    public record CategoryMetric(
            Long categoryId,
            String categoryName,
            BigDecimal amount,
            BigDecimal sharePercent
    ) {}

    public record PeakDayRecord(
            String label,
            BigDecimal amount
    ) {}

    public record PeakMonthRecord(
            String label,
            BigDecimal amount,
            Double growthPercent
    ) {}
}
