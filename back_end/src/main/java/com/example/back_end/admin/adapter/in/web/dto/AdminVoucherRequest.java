package com.example.back_end.admin.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record AdminVoucherRequest(
    @NotBlank String code,
    @NotBlank String description,
    @NotBlank String discountType, 
    @NotNull BigDecimal discountValue,
    @NotNull BigDecimal minimumOrder,
    @NotNull BigDecimal maximumDiscountAmount,
    @NotNull Integer usageLimit,
    @NotBlank String startDate, 
    @NotBlank String endDate,
    @NotNull Boolean isActive,
    @NotNull Long createdById
) {}