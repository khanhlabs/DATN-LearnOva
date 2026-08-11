package com.example.back_end.commerce.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;

public record RejectPayoutRequestRequest(
        @NotBlank String reason
) {
}
