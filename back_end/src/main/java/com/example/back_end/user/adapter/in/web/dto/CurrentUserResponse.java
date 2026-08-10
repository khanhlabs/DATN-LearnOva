package com.example.back_end.user.adapter.in.web.dto;

import com.example.back_end.user.domain.enums.GenderType;
import com.example.back_end.auth.domain.enums.RoleName;

import java.time.LocalDate;
import java.util.Set;

public record CurrentUserResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        String avatar,
        String coverImage,
        LocalDate dateOfBirth,
        GenderType gender,
        Set<RoleName> roles,
        RoleName activeRole
) {}