package com.example.back_end.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record VoiceCourseSearchRequest(
        @NotBlank(message = "Search query is required")
        @Size(max = 300, message = "Search query is too long")
        String query
) {
}
