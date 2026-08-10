package com.example.back_end.admin.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;

public record RejectCourseRequest(
        @NotBlank(message = "Reason is required") String reason
) {}
