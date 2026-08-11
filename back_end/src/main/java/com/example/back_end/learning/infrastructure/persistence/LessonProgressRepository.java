package com.example.back_end.learning.infrastructure.persistence;

import com.example.back_end.learning.domain.LessonProgress;
import com.example.back_end.learning.domain.LessonProgressId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface LessonProgressRepository extends JpaRepository<LessonProgress, LessonProgressId> {

    Optional<LessonProgress> findByUserIdAndLessonId(Long userId, Long lessonId);

    @Query("SELECT lp FROM LessonProgress lp WHERE lp.user.id = :userId AND lp.lesson.section.course.id = :courseId")
    List<LessonProgress> findByUserIdAndCourseId(@Param("userId") Long userId, @Param("courseId") Long courseId);

    @Query("SELECT COUNT(lp) FROM LessonProgress lp WHERE lp.user.id = :userId AND lp.lesson.section.course.id = :courseId AND lp.isCompleted = true")
    long countCompletedLessonsByUserAndCourse(@Param("userId") Long userId, @Param("courseId") Long courseId);

    boolean existsByUserIdAndLessonId(Long userId, Long lessonId);

    boolean existsByUser_IdAndLesson_IdAndIsCompletedTrue(Long userId, Long lessonId);

    @Query(value = """
            SELECT COALESCE(AVG(lp.watched_seconds), 0)
            FROM lesson_progress lp
            JOIN lessons l ON l.lesson_id = lp.lesson_id
            JOIN sections s ON s.section_id = l.section_id
            JOIN courses c ON c.course_id = s.course_id
            WHERE c.instructor_id = :instructorId AND lp.watched_seconds > 0
            """, nativeQuery = true)
    Double findAvgWatchedSecondsByInstructor(@Param("instructorId") Long instructorId);

    interface StartedCompletedProjection {
        Long getStartedCount();
        Long getCompletedCount();
    }

    @Query(value = """
            SELECT
                COUNT(*) FILTER (WHERE lp.watched_seconds > 0) AS startedCount,
                COUNT(*) FILTER (WHERE lp.is_completed = true) AS completedCount
            FROM lesson_progress lp
            JOIN lessons l ON l.lesson_id = lp.lesson_id
            JOIN sections s ON s.section_id = l.section_id
            JOIN courses c ON c.course_id = s.course_id
            WHERE c.instructor_id = :instructorId
            """, nativeQuery = true)
    StartedCompletedProjection findStartedVsCompletedByInstructor(@Param("instructorId") Long instructorId);

    long countByLesson_IdAndIsCompletedTrue(Long lessonId);

    interface LessonAttentionProjection {
        Long getLessonId();
        String getLessonTitle();
        String getCourseTitle();
        Long getStartedCount();
        Long getCompletedCount();
    }

    @Query(value = """
            SELECT
                l.lesson_id AS lessonId,
                l.title AS lessonTitle,
                c.title AS courseTitle,
                COUNT(*) FILTER (WHERE lp.watched_seconds > 0) AS startedCount,
                COUNT(*) FILTER (WHERE lp.is_completed = true) AS completedCount
            FROM lesson_progress lp
            JOIN lessons l ON l.lesson_id = lp.lesson_id
            JOIN sections s ON s.section_id = l.section_id
            JOIN courses c ON c.course_id = s.course_id
            WHERE c.instructor_id = :instructorId
            GROUP BY l.lesson_id, l.title, c.title
            """, nativeQuery = true)
    List<LessonAttentionProjection> findLessonAttentionByInstructor(@Param("instructorId") Long instructorId);

    @Query("SELECT lp.lesson.section.course.id FROM LessonProgress lp " +
            "WHERE lp.user.id = :userId " +
            "GROUP BY lp.lesson.section.course.id " +
            "ORDER BY MAX(lp.updatedAt) DESC")
    List<Long> findCourseIdsOrderByLastActivity(@Param("userId") Long userId);

    @Query("SELECT COALESCE(SUM(lp.watchedSeconds), 0) FROM LessonProgress lp WHERE lp.user.id = :userId")
    long sumWatchedSecondsByUserId(@Param("userId") Long userId);

    @Query("SELECT DISTINCT lp.updatedAt FROM LessonProgress lp WHERE lp.user.id = :userId")
    List<Instant> findDistinctActivityInstantsByUserId(@Param("userId") Long userId);
}
