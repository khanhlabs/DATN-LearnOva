package com.example.back_end.instructor.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReplyReviewRequest(
        @NotBlank(message = "Reply cannot be empty")
        @Size(max = 2000, message = "Reply must be at most 2000 characters")
        String reply
) {
}
