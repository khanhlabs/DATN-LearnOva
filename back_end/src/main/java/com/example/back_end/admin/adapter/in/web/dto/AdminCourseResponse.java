package com.example.back_end.admin.adapter.in.web.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record AdminCourseResponse(
    Long id,
    String thumbnailKey,
    String title,
    String slug,
    BigDecimal basePrice,
    String level,
    String status,
    Long instructorId,
    String instructorName,
    Long categoryId,
    String categoryName,
    OffsetDateTime publishedAt
) {}
