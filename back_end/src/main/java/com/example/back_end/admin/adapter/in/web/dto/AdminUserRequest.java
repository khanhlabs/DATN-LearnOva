package com.example.back_end.admin.adapter.in.web.dto;

import java.time.LocalDate;
import com.example.back_end.user.domain.enums.GenderType;

public record AdminUserRequest(
    String fullName,
    String email,
    String phone,
    String avatar,
    String coverImage,
    LocalDate dateOfBirth,
    GenderType gender,
    String password,
    String role,
    Boolean isActive,
    Boolean isDeleted
) {}