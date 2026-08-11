package com.example.back_end.admin.adapter.in.web.dto;
import com.example.back_end.course.domain.Category;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminCategoryRequest(
    @NotBlank(message = "Category name is required")
    @Size(min = 1, max = 255, message = "Category name must be between 1 and 255 characters")
    String name,

    Long parentId,

    Boolean isDeleted
) {}
