package com.example.back_end.media.adapter.in.web.dto;

import com.example.back_end.media.domain.enums.UploadType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record GenerateUploadUrlRequest(
        @NotNull
        UploadType type,
        @NotBlank
        String fileName,
        @NotBlank
        String contentType
) {
}
