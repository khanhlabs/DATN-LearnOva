package com.example.back_end.instructor.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateCourseStatusRequest(
        @NotBlank(message = "Status is required") String status
) {}
