package com.example.back_end.commerce.adapter.in.web.dto;
import com.example.back_end.course.domain.Course;

import jakarta.validation.constraints.NotNull;

public record AddCartItemRequest(
        @NotNull(message = "Course id is required") Long courseId
) {}
