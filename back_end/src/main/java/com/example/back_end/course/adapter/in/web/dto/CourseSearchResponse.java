package com.example.back_end.course.adapter.in.web.dto;

public record CourseSearchResponse(
        Long courseId,
        String title,
        String titleHighlight,
        String instructorName,
        String categoryName,
        String level,
        double basePrice,
        String thumbnailKey,
        double avgRating,
        long studentCount
) {}
