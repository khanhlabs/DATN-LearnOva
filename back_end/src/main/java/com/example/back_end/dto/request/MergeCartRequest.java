package com.example.back_end.dto.request;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record MergeCartRequest(
        @NotNull(message = "Course ids are required") List<Long> courseIds
) {}
