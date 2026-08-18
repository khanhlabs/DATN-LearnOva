package com.example.back_end.instructor.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TeacherTagRequest(
    @NotBlank(message = "Tag name is required")
    @Size(min = 1, max = 50, message = "Tag name must be between 1 and 50 characters")
    String name,
    String slug,
    Long courseId,
    Boolean isDeleted
) {}
