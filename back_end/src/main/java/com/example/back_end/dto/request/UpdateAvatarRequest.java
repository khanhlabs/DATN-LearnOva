package com.example.back_end.dto.request;

import jakarta.validation.constraints.NotBlank;

public record UpdateAvatarRequest(
        @NotBlank String avatarKey
) {}
