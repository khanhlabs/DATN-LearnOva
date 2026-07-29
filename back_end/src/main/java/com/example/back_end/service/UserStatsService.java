package com.example.back_end.service;

import com.example.back_end.dto.response.MyEnrolledCourseResponse;
import com.example.back_end.dto.response.UserStatsResponse;
import com.example.back_end.repository.LessonProgressRepository;
import com.example.back_end.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserStatsService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final LessonProgressRepository lessonProgressRepository;
    private final EnrollmentService enrollmentService;

    @Transactional(readOnly = true)
    public UserStatsResponse getMyStats() {
        Long userId = getCurrentUserId();

        long watchedSeconds = lessonProgressRepository.sumWatchedSecondsByUserId(userId);
        double totalStudyHours = watchedSeconds / 3600.0;

        List<Instant> activityInstants = lessonProgressRepository.findDistinctActivityInstantsByUserId(userId);
        int streakDays = computeStreakDays(activityInstants);

        List<MyEnrolledCourseResponse> enrolledCourses = enrollmentService.getMyEnrolledCourses();
        int enrolledCourseCount = enrolledCourses.size();
        int completedCourseCount = (int) enrolledCourses.stream()
                .filter(c -> c.totalLessons() != null && c.totalLessons() > 0
                        && c.completedLessons() != null
                        && c.completedLessons().intValue() == c.totalLessons().intValue())
                .count();
        int totalCompletedLessons = enrolledCourses.stream()
                .mapToInt(c -> c.completedLessons() == null ? 0 : c.completedLessons())
                .sum();

        // Points formula (documented, deterministic, derived only from real completed work):
        //   10 points per completed lesson + 100 points per fully completed course.
        int points = totalCompletedLessons * 10 + completedCourseCount * 100;

        return new UserStatsResponse(totalStudyHours, streakDays, enrolledCourseCount, completedCourseCount, points);
    }

    // Streak rule: count consecutive calendar days (Asia/Ho_Chi_Minh) with activity, walking
    // backward starting from "today" if today has activity, otherwise starting from
    // "yesterday" (so a streak isn't reported as broken just because the user hasn't studied
    // yet today -- it only breaks once a full day passes with zero activity). If there is no
    // activity on today OR yesterday, streak is 0.
    private int computeStreakDays(List<Instant> activityInstants) {
        if (activityInstants == null || activityInstants.isEmpty()) return 0;

        Set<LocalDate> dates = activityInstants.stream()
                .map(instant -> instant.atZone(ZONE).toLocalDate())
                .collect(Collectors.toSet());

        LocalDate today = LocalDate.now(ZONE);
        LocalDate cursor = dates.contains(today) ? today : today.minusDays(1);

        if (!dates.contains(cursor)) return 0;

        int streak = 0;
        while (dates.contains(cursor)) {
            streak++;
            cursor = cursor.minusDays(1);
        }
        return streak;
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Object principal = authentication == null ? null : authentication.getPrincipal();

        if (principal instanceof CustomUserDetails userDetails) {
            return userDetails.getId();
        }

        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
    }
}
