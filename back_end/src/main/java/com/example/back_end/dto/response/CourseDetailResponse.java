package com.example.back_end.dto.response;

import com.example.back_end.entity.enums.CourseLevel;

import java.math.BigDecimal;
import java.util.List;

public record CourseDetailResponse(
                Long courseId,
                String title,
                String description,
                String thumbnailKey,
                BigDecimal basePrice,
                CourseLevel level,
                String language,
                List<String> requirements,
                List<String> whatYouLearn,
                String categoryName,
                Long categoryId,
                long lessonCount,
                long totalDurationSeconds,
                InstructorInfo instructor,
                List<SectionInfo> sections) {
        public record InstructorInfo(
                        Long id,
                        String fullName,
                        String avatarKey,
                        String description) {
        }

        public record SectionInfo(
                        Long sectionId,
                        String title,
                        Double sectionOrder,
                        List<LessonInfo> lessons) {
        }

        public record LessonInfo(
                        Long lessonId,
                        String title,
                        Double lessonOrder,
                        Integer durationSeconds,
                        String videoKey,
                        Boolean isPreview) {
        }
}
