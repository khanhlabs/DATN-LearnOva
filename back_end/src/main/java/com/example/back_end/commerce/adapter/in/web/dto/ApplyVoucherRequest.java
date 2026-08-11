package com.example.back_end.commerce.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ApplyVoucherRequest(
        @NotBlank String code,
        @NotNull BigDecimal subtotal
) {}
