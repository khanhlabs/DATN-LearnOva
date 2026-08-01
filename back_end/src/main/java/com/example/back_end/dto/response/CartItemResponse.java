package com.example.back_end.dto.response;

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
