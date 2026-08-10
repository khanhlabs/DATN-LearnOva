package com.example.back_end.instructor.adapter.in.web.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdatePromotionRequest(
        @NotNull @Min(1) @Max(100) Integer discountPercent,
        @NotBlank String startDate,
        @NotBlank String endDate
) {
}
