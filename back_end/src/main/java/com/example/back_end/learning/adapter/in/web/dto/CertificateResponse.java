package com.example.back_end.learning.adapter.in.web.dto;

import java.time.Instant;

public record CertificateResponse(
        Long id,
        Long courseId,
        String courseTitle,
        String certificateCode,
        Instant issuedAt
) {
}
