package com.example.back_end.commerce.adapter.in.web.dto;

import java.math.BigDecimal;

public record PayoutBalanceResponse(
        BigDecimal lifetimeRevenue,
        BigDecimal lifetimeRefunds,
        BigDecimal pendingOrPaidPayouts,
        BigDecimal availableBalance
) {
}
