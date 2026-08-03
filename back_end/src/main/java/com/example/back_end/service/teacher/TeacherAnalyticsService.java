package com.example.back_end.service.teacher;

import com.example.back_end.dto.response.teacher.TeacherAnalyticsResponse;
import com.example.back_end.dto.response.teacher.TeacherCoursesResponse;
import com.example.back_end.entity.User;
import com.example.back_end.exception.ResourceNotFoundException;
import com.example.back_end.repository.EnrollmentRepository;
import com.example.back_end.repository.LessonQARepository;
import com.example.back_end.repository.LessonProgressRepository;
import com.example.back_end.repository.ReviewRepository;
import com.example.back_end.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.Period;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeacherAnalyticsService {

    private static final int TREND_WINDOW_DAYS = 30;
    private static final long MIN_STARTED_FOR_ATTENTION = 3;
    private static final int LESSON_ATTENTION_LIMIT = 6;

    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ReviewRepository reviewRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final LessonQARepository lessonQARepository;
    private final TeacherCourseService teacherCourseService;

    @Transactional(readOnly = true)
    public TeacherAnalyticsResponse getAnalytics(String email) {
        User instructor = userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Long instructorId = instructor.getId();

        double completionRate = enrollmentRepository.findAvgProgressByInstructorId(instructorId);
        double avgRating = reviewRepository.getAverageRatingByInstructorId(instructorId);
        long ratingCount = reviewRepository.countByCourseInstructorId(instructorId);

        Double avgWatchedSeconds = lessonProgressRepository.findAvgWatchedSecondsByInstructor(instructorId);
        double avgWatchTimeMinutes = (avgWatchedSeconds != null ? avgWatchedSeconds : 0) / 60.0;

        LessonProgressRepository.StartedCompletedProjection startedVsCompleted =
                lessonProgressRepository.findStartedVsCompletedByInstructor(instructorId);
        long startedCount = startedVsCompleted != null && startedVsCompleted.getStartedCount() != null
                ? startedVsCompleted.getStartedCount() : 0;
        long completedLessonCount = startedVsCompleted != null && startedVsCompleted.getCompletedCount() != null
                ? startedVsCompleted.getCompletedCount() : 0;
        double dropOffRate = dropOffRate(startedCount, completedLessonCount);

        Instant windowStart = Instant.now().minus(TREND_WINDOW_DAYS, ChronoUnit.DAYS);
        List<TeacherAnalyticsResponse.CompletionPoint> dailyCompletions = enrollmentRepository
                .findDailyCompletionsByInstructor(instructorId, windowStart)
                .stream()
                .map(row -> new TeacherAnalyticsResponse.CompletionPoint(row.getDay(), row.getCount()))
                .toList();

        List<TeacherCoursesResponse> myCourses = teacherCourseService.getMyCourses(email);
        List<TeacherAnalyticsResponse.CoursePerformance> coursePerformance = buildCoursePerformance(myCourses, instructorId);

        long activeStudents = enrollmentRepository.countActiveStudentsByInstructorId(instructorId);
        long totalStudents = enrollmentRepository.countDistinctStudentsByInstructorId(instructorId);
        long questionsAsked = lessonQARepository.countQuestionsByInstructor(instructorId);

        TeacherAnalyticsResponse.StudentEngagement engagement = new TeacherAnalyticsResponse.StudentEngagement(
                activeStudents,
                totalStudents,
                completedLessonCount,
                questionsAsked,
                ratingCount
        );

        List<TeacherAnalyticsResponse.LessonAttention> lessonsAttention = buildLessonAttention(instructorId);
        TeacherAnalyticsResponse.Demographics demographics = buildDemographics(instructorId);

        return new TeacherAnalyticsResponse(
                completionRate,
                avgRating,
                ratingCount,
                avgWatchTimeMinutes,
                dropOffRate,
                dailyCompletions,
                coursePerformance,
                engagement,
                lessonsAttention,
                demographics
        );
    }

    private double dropOffRate(long started, long completed) {
        return started > 0 ? (1 - (double) completed / started) * 100 : 0;
    }

    private List<TeacherAnalyticsResponse.CoursePerformance> buildCoursePerformance(
            List<TeacherCoursesResponse> myCourses, Long instructorId) {
        Map<Long, Double> progressByCourse = enrollmentRepository.findAvgProgressByCourseForInstructor(instructorId)
                .stream()
                .collect(Collectors.toMap(
                        EnrollmentRepository.CourseProgressProjection::getCourseId,
                        EnrollmentRepository.CourseProgressProjection::getAvgProgress));

        return myCourses.stream()
                .filter(c -> !Boolean.TRUE.equals(c.isDeleted()))
                .map(c -> new TeacherAnalyticsResponse.CoursePerformance(
                        c.courseId(),
                        c.title(),
                        progressByCourse.getOrDefault(c.courseId(), 0.0),
                        c.avgRating(),
                        c.studentCount()
                ))
                .sorted(Comparator.comparingLong(TeacherAnalyticsResponse.CoursePerformance::studentCount).reversed())
                .toList();
    }

    private List<TeacherAnalyticsResponse.LessonAttention> buildLessonAttention(Long instructorId) {
        return lessonProgressRepository
                .findLessonAttentionByInstructor(instructorId)
                .stream()
                .filter(row -> row.getStartedCount() != null && row.getStartedCount() >= MIN_STARTED_FOR_ATTENTION)
                .map(row -> {
                    long started = row.getStartedCount();
                    long completed = row.getCompletedCount() != null ? row.getCompletedCount() : 0;
                    return new TeacherAnalyticsResponse.LessonAttention(
                            row.getLessonId(),
                            row.getLessonTitle(),
                            row.getCourseTitle(),
                            started,
                            completed,
                            dropOffRate(started, completed)
                    );
                })
                .sorted(Comparator.comparingDouble(TeacherAnalyticsResponse.LessonAttention::dropOffRate).reversed())
                .limit(LESSON_ATTENTION_LIMIT)
                .toList();
    }

    private TeacherAnalyticsResponse.Demographics buildDemographics(Long instructorId) {
        List<User> students = enrollmentRepository.findDistinctStudentsByInstructorId(instructorId);

        Map<String, Long> genderDistribution = new LinkedHashMap<>();
        genderDistribution.put("Male", 0L);
        genderDistribution.put("Female", 0L);
        genderDistribution.put("Other", 0L);
        genderDistribution.put("Unspecified", 0L);

        Map<String, Long> ageDistribution = new LinkedHashMap<>();
        ageDistribution.put("Under 18", 0L);
        ageDistribution.put("18-24", 0L);
        ageDistribution.put("25-34", 0L);
        ageDistribution.put("35-44", 0L);
        ageDistribution.put("45+", 0L);
        ageDistribution.put("Unknown", 0L);

        LocalDate today = LocalDate.now();
        for (User student : students) {
            String genderKey = student.getGender() != null ? student.getGender().name() : "Unspecified";
            genderDistribution.merge(genderKey, 1L, Long::sum);

            String ageKey = "Unknown";
            if (student.getDateOfBirth() != null) {
                int age = Period.between(student.getDateOfBirth(), today).getYears();
                if (age < 18) ageKey = "Under 18";
                else if (age <= 24) ageKey = "18-24";
                else if (age <= 34) ageKey = "25-34";
                else if (age <= 44) ageKey = "35-44";
                else ageKey = "45+";
            }
            ageDistribution.merge(ageKey, 1L, Long::sum);
        }

        return new TeacherAnalyticsResponse.Demographics(genderDistribution, ageDistribution);
    }
}
