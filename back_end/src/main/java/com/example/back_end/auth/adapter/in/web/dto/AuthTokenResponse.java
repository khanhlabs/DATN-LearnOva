package com.example.back_end.auth.adapter.in.web.dto;

public record AuthTokenResponse(
        String accessToken,
        String refreshToken
) {}