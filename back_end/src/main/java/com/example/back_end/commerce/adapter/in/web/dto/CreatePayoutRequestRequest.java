package com.example.back_end.commerce.adapter.in.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreatePayoutRequestRequest(
        @NotNull @DecimalMin("0.01") BigDecimal amount,
        String notes
) {
}
