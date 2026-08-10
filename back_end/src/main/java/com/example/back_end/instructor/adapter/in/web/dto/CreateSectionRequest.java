package com.example.back_end.instructor.adapter.in.web.dto;

public record CreateSectionRequest(
        String title,
        Integer sectionOrder
) {
}