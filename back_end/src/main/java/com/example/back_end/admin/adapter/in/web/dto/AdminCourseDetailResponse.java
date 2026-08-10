package com.example.back_end.admin.adapter.in.web.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record AdminCourseDetailResponse(
        Long id,
        String title,
        String description,
        String thumbnailKey,
        BigDecimal basePrice,
        String level,
        String language,
        String status,
        Long instructorId,
        String instructorName,
        String instructorAvatar,
        String categoryName,
        Long categoryId,
        List<String> requirements,
        List<String> whatYouLearn,
        OffsetDateTime publishedAt,
        long lessonCount,
        long totalDurationSeconds,
        List<SectionInfo> sections
) {
    public record SectionInfo(
            Long sectionId,
            String title,
            Double sectionOrder,
            List<LessonInfo> lessons
    ) {}

    public record LessonInfo(
            Long lessonId,
            String title,
            Double lessonOrder,
            Integer durationSeconds,
            String videoKey,
            Boolean isPreview
    ) {}
}
