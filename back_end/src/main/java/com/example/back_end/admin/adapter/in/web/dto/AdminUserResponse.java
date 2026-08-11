package com.example.back_end.admin.adapter.in.web.dto;

import java.time.Instant;
import java.time.LocalDate;

import com.example.back_end.user.domain.enums.GenderType;

public record AdminUserResponse(
    Long id,
    String fullName,
    String email,
    String phone,
    String avatar,
    String coverImage,
    LocalDate dateOfBirth,
    GenderType gender,
    String role,
    String status,
    Instant createdAt,
    Boolean isDeleted,
    Instant updatedAt
) {}
