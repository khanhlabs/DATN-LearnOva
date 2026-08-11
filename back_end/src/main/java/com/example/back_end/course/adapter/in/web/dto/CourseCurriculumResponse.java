package com.example.back_end.course.adapter.in.web.dto;

import java.util.List;

public record CourseCurriculumResponse(
        Long courseId,
        String title,
        Integer chaptersTotal,
        Integer lessonsTotal,
        List<SectionResponse> curriculum
) {
}