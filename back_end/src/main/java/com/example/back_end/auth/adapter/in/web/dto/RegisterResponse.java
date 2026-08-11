package com.example.back_end.auth.adapter.in.web.dto;

public record RegisterResponse(
        boolean success,
        String message
) {}