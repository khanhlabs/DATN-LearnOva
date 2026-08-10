package com.example.back_end.instructor.adapter.in.web.dto;

import com.example.back_end.course.domain.enums.LessonSourceType;

public record LessonSourceResponse(
        Long id,
        String fileKey,
        String originalFileName,
        LessonSourceType resourceType
) {
}
