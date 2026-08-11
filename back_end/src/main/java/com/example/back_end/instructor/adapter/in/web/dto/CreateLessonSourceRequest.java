package com.example.back_end.instructor.adapter.in.web.dto;

import com.example.back_end.course.domain.enums.LessonSourceType;

public record CreateLessonSourceRequest(
        String fileKey,
        String originalFileName,
        String contentType,
        Long fileSizeBytes,
        LessonSourceType resourceType
) {
}
