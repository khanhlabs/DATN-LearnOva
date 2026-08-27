package com.example.back_end.learning.application;

import com.example.back_end.learning.adapter.in.web.dto.CourseProgressResponse;
import com.example.back_end.learning.adapter.in.web.dto.LessonProgressResponse;
import com.example.back_end.learning.adapter.in.web.dto.LessonProgressRequest;
import com.example.back_end.course.domain.Lesson;
import com.example.back_end.learning.domain.LessonProgress;
import com.example.back_end.learning.domain.LessonProgressId;
import com.example.back_end.auth.domain.User;
import com.example.back_end.shared.exception.BusinessException;
import com.example.back_end.shared.exception.ResourceNotFoundException;
import com.example.back_end.learning.infrastructure.persistence.EnrollmentRepository;
import com.example.back_end.course.infrastructure.persistence.LessonRepository;
import com.example.back_end.learning.infrastructure.persistence.LessonProgressRepository;
import com.example.back_end.auth.infrastructure.persistence.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LessonProgressService {

    private final LessonProgressRepository lessonProgressRepository;
    private final LessonRepository lessonRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CertificateService certificateService;

    @Transactional
    public CourseProgressResponse updateProgress(Long userId, LessonProgressRequest request) {
        Lesson lesson = lessonRepository.findById(request.getLessonId())
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found with id: " + request.getLessonId()));

        Long courseId = lesson.getSection().getCourse().getId();

        boolean isEnrolled = enrollmentRepository.existsByUserIdAndCourseId(userId, courseId);
        if (!isEnrolled) {
            throw new BusinessException("Bạn chưa đăng ký khóa học này!");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        LessonProgress progress = lessonProgressRepository.findByUserIdAndLessonId(userId, request.getLessonId())
                .orElseGet(() -> {
                    LessonProgress newProgress = new LessonProgress();
                    LessonProgressId id = new LessonProgressId();
                    id.setUserId(userId);
                    id.setLessonId(request.getLessonId());
                    newProgress.setId(id);
                    newProgress.setUser(user);
                    newProgress.setLesson(lesson);
                    newProgress.setIsCompleted(false);
                    newProgress.setWatchedSeconds(0);
                    return newProgress;
                });

        int currentWatched = progress.getWatchedSeconds() != null ? progress.getWatchedSeconds() : 0;
        int newWatched = Math.max(currentWatched, request.getWatchedSeconds() != null ? request.getWatchedSeconds() : 0);
        progress.setWatchedSeconds(newWatched);

        int duration = lesson.getDurationSeconds() != null && lesson.getDurationSeconds() > 0
                ? lesson.getDurationSeconds()
                : 0;

        boolean currentlyCompleted = Boolean.TRUE.equals(progress.getIsCompleted());
        if (!currentlyCompleted && Boolean.TRUE.equals(request.getCompleted())) {
            progress.setIsCompleted(true);
        } else if (!currentlyCompleted && duration > 0) {
            double percent = ((double) newWatched / duration) * 100.0;
            if (percent >= 95.0) {
                progress.setIsCompleted(true);
            }
        }

        progress.setUpdatedAt(java.time.Instant.now());
        lessonProgressRepository.save(progress);

        CourseProgressResponse result = getCourseProgress(userId, courseId);

        // enrollments.progress_percent/completed_at are kept in sync by the
        // trg_sync_enrollment_progress DB trigger (fires on lessonprogress.is_completed
        // changes), so it's already updated by the time we get here — issueIfAbsent is
        // itself idempotent, so it's safe to call on every completed check.
        if (result.isCourseCompleted()) {
            certificateService.issueIfAbsent(user, lesson.getSection().getCourse());
        }

        return result;
    }

    @Transactional
    public CourseProgressResponse restartCourse(Long userId, Long courseId) {
        var enrollment = enrollmentRepository.findByUser_IdAndCourse_Id(userId, courseId)
                .orElseThrow(() -> new BusinessException("Bạn chưa đăng ký khóa học này!"));

        lessonProgressRepository.resetProgressByUserIdAndCourseId(userId, courseId);

        // Explicitly reset the enrollment too. This also covers completed courses
        // with no lesson-progress rows and keeps the completion history consistent.
        enrollment.setProgressPercent(0);
        enrollment.setCompletedAt(null);
        enrollmentRepository.save(enrollment);

        return getCourseProgress(userId, courseId);
    }

    public CourseProgressResponse getCourseProgress(Long userId, Long courseId) {
        List<Lesson> lessons = lessonRepository.findBySectionCourseId(courseId);
        List<LessonProgress> progressList = lessonProgressRepository.findByUserIdAndCourseId(userId, courseId);

        List<LessonProgressResponse> lessonResponses = lessons.stream().map(lesson -> {
            LessonProgress lp = progressList.stream()
                    .filter(p -> p.getLesson().getId().equals(lesson.getId()))
                    .findFirst()
                    .orElse(null);

            int watched = lp != null && lp.getWatchedSeconds() != null ? lp.getWatchedSeconds() : 0;
            boolean completed = lp != null && Boolean.TRUE.equals(lp.getIsCompleted());
            int duration = lesson.getDurationSeconds() != null && lesson.getDurationSeconds() > 0 ? lesson.getDurationSeconds() : 0;
            double percent = duration > 0 ? Math.min(100.0, ((double) watched / duration) * 100.0) : (completed ? 100.0 : 0.0);

            return LessonProgressResponse.builder()
                    .lessonId(lesson.getId())
                    .watchedSeconds(watched)
                    .isCompleted(completed)
                    .progressPercent(percent)
                    .build();
        }).toList();

        long completedCount = lessonResponses.stream().filter(LessonProgressResponse::getIsCompleted).count();
        long totalCount = lessons.size();
        double coursePercent = totalCount > 0 ? ((double) completedCount / totalCount) * 100.0 : 0.0;
        boolean isCourseCompleted = totalCount > 0 && completedCount == totalCount;

        return CourseProgressResponse.builder()
                .courseId(courseId)
                .completedLessonsCount(completedCount)
                .totalLessonsCount(totalCount)
                .courseProgressPercent(coursePercent)
                .isCourseCompleted(isCourseCompleted)
                .lessonProgresses(lessonResponses)
                .build();
    }
}
