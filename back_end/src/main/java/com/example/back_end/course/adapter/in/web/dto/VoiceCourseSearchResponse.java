package com.example.back_end.course.adapter.in.web.dto;

import java.util.List;
import java.util.Map;

public record VoiceCourseSearchResponse(
        String interpretedQuery,
        Map<String, Object> filters,
        List<PublicCourseResponse> courses
) {
}
