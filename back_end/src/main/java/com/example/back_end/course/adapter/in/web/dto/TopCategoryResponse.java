package com.example.back_end.course.adapter.in.web.dto;

public record TopCategoryResponse(
        Long id,
        String name,
        String slug,
        long soldCount
) {}
