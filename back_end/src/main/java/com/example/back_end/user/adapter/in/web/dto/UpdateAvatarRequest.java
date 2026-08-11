package com.example.back_end.user.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateAvatarRequest(
        @NotBlank String avatarKey
) {}
