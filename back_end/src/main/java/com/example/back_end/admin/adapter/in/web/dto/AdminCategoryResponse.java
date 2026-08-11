package com.example.back_end.admin.adapter.in.web.dto;

import java.time.Instant;

public record AdminCategoryResponse(
    Long id,
    String name,
    String slug,
    Long parentId,
    String parentName,
    Boolean isDeleted,
    Instant createdAt,
    Instant updatedAt
) {}
