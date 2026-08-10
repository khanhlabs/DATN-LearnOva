package com.example.back_end.instructor.adapter.in.web.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public record TeacherAnalyticsResponse(
        double completionRate,
        double avgRating,
        long ratingCount,
        double avgWatchTimeMinutes,
        double dropOffRate,
        List<CompletionPoint> dailyCompletions,
        List<CoursePerformance> coursePerformance,
        StudentEngagement engagement,
        List<LessonAttention> lessonsAttention,
        Demographics demographics
) {
    public record CompletionPoint(LocalDate day, long count) {}

    public record CoursePerformance(
            Long courseId,
            String title,
            double completionRate,
            double avgRating,
            long studentCount
    ) {}

    public record StudentEngagement(
            long activeStudents,
            long totalStudents,
            long lessonsCompleted,
            long questionsAsked,
            long reviewsSubmitted
    ) {}

    public record LessonAttention(
            Long lessonId,
            String lessonTitle,
            String courseTitle,
            long startedCount,
            long completedCount,
            double dropOffRate
    ) {}

    public record Demographics(
            Map<String, Long> genderDistribution,
            Map<String, Long> ageDistribution
    ) {}
}
