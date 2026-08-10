package com.example.back_end.shared.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Percent change from a previous period to a current one, used by the teacher dashboard/revenue trend cards. */
public final class PercentDeltaCalculator {

    private PercentDeltaCalculator() {
    }

    /** Returns null (rather than a misleading "0%" or "infinite%") when there is no previous-period baseline. */
    public static Double percentDelta(BigDecimal previous, BigDecimal current) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }
        return current.subtract(previous)
                .divide(previous, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue();
    }
}
