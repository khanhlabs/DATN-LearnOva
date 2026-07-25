package com.example.back_end.dto.resquest;

import jakarta.validation.constraints.NotBlank;

public record UpdateAvatarRequest(
        @NotBlank String avatarKey
) {}
