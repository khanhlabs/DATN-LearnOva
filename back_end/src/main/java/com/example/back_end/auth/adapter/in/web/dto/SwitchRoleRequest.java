package com.example.back_end.auth.adapter.in.web.dto;

import com.example.back_end.auth.domain.enums.RoleName;
import jakarta.validation.constraints.NotNull;

public record SwitchRoleRequest(
        @NotNull RoleName role
) {}
