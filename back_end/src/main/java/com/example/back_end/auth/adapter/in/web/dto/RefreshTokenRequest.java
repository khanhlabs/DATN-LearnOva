package com.example.back_end.auth.adapter.in.web.dto;

import lombok.Data;

@Data
public class RefreshTokenRequest  {
    private String refreshToken;
}