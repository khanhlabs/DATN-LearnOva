package com.example.back_end.admin.adapter.in.web.dto;

import java.time.Instant;

public record AdminTagResponse(
    Long id,
    String name,
    String slug,
    Long courseId,
    String courseTitle,
    Boolean isDeleted,
    Instant updatedAt
) {}
