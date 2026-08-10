package com.example.back_end.instructor.adapter.in.web.dto;

public record UpdateLessonVideoRequest(
        String videoKey,
        String videoOriginalFilename,
        String videoContentType,
        Long videoSizeBytes,
        Integer durationSeconds
) {
}
