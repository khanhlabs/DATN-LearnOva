package com.example.back_end.auth.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResetPasswordRequest {

    @NotBlank(message = "Reset token is required.")
    private String token;

    @NotBlank(message = "Password is required.")
    @Size(min = 6, message = "Password must be at least 6 characters.")
    private String newPassword;
}
