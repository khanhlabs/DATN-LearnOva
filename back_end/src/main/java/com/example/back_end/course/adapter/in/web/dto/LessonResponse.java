package com.example.back_end.course.adapter.in.web.dto;

public record LessonResponse(
        Long id,
        String title,
        String duration,
        Boolean completed
) {
}