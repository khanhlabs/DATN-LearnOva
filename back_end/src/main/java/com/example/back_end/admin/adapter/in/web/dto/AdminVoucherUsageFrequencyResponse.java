package com.example.back_end.admin.adapter.in.web.dto;

public record AdminVoucherUsageFrequencyResponse(
        String month,
        Long activations
) {}
