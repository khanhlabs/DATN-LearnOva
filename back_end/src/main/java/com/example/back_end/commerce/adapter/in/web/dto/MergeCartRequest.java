package com.example.back_end.commerce.adapter.in.web.dto;
import com.example.back_end.course.domain.Course;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record MergeCartRequest(
        @NotNull(message = "Course ids are required") List<Long> courseIds
) {}
