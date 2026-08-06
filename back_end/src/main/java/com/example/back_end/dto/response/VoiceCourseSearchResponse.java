package com.example.back_end.dto.response;

import java.util.List;
import java.util.Map;

public record VoiceCourseSearchResponse(
        String interpretedQuery,
        Map<String, Object> filters,
        List<PublicCourseResponse> courses
) {
}
