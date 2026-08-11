package com.example.back_end.commerce.adapter.in.web.dto;

import java.util.List;

public record CreatePaymentRequest(
        Long courseId,
        List<Long> courseIds,
        String voucherCode
) {}
