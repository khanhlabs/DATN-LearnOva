package com.example.back_end.dto.request;

import jakarta.validation.constraints.NotNull;

public record AddCartItemRequest(
        @NotNull(message = "Course id is required") Long courseId
) {}
