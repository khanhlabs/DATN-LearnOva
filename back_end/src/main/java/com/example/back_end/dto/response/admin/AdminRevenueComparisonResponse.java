package com.example.back_end.dto.response.admin;

import java.math.BigDecimal;
import java.util.List;

public record AdminRevenueComparisonResponse(
        String range,
        List<ComparisonPoint> points
) {
    public record ComparisonPoint(
            String label,
            BigDecimal totalCashFlow,
            BigDecimal instructorPayouts
    ) {}
}
