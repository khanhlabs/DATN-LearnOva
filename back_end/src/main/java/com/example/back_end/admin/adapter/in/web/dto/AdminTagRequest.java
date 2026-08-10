package com.example.back_end.admin.adapter.in.web.dto;
import com.example.back_end.course.domain.Tag;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminTagRequest(
    @NotBlank(message = "Tag name is required")
    @Size(min = 1, max = 50, message = "Tag name must be between 1 and 50 characters")
    String name,

    String slug,

    Long courseId,

    Boolean isDeleted
) {}
