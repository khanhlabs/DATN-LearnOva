package com.example.back_end.course.adapter.in.web.dto;

import java.util.List;

public record SectionResponse(
        Long id,
        String title,
        Integer completedLessons,
        Integer totalLessons,
        Integer percent,
        List<LessonResponse> lessons
) {
}