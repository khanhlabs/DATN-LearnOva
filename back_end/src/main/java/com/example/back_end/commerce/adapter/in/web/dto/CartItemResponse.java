package com.example.back_end.commerce.adapter.in.web.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record CartItemResponse(
        Long courseId,
        String title,
        String teacher,
        BigDecimal price,
        String thumbnailKey,
        String image,
        Instant addedAt
) {}
