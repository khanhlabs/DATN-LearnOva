package com.example.back_end.commerce.application;

import java.math.BigDecimal;
import java.math.RoundingMode;
import org.springframework.stereotype.Component;

@Component
public class RevenueShareCalculator {

    public static final int ADMIN_PERCENT = 20;
    public static final int INSTRUCTOR_PERCENT = 80;

    public RevenueShare calculate(BigDecimal actualPaidAmount) {
        if (actualPaidAmount == null || actualPaidAmount.signum() < 0) {
            throw new IllegalArgumentException("Actual paid amount must not be negative");
        }
        BigDecimal paid = actualPaidAmount.setScale(2, RoundingMode.HALF_UP);
        BigDecimal adminAmount = paid.multiply(BigDecimal.valueOf(ADMIN_PERCENT))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        return new RevenueShare(adminAmount, paid.subtract(adminAmount));
    }

    public record RevenueShare(BigDecimal adminAmount, BigDecimal instructorAmount) {}
}
