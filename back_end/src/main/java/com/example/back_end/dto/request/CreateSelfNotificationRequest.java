package com.example.back_end.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateSelfNotificationRequest(
        @NotBlank @Size(max = 200) String title,
        @NotBlank @Size(max = 2000) String content,
        @Size(max = 500) String link
) {
}
