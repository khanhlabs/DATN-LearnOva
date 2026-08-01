package com.example.back_end.repository;

import java.time.Instant;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.back_end.entity.Enrollment;
import com.example.back_end.entity.EnrollmentId;
import java.util.Optional;

public interface EnrollmentRepository extends JpaRepository<Enrollment, EnrollmentId> {

    @Query("SELECT e FROM Enrollment e WHERE e.course.id IN :courseIds")
    List<Enrollment> findByCourseIdIn(@Param("courseIds") List<Long> courseIds);

    @Query("SELECT e FROM Enrollment e " +
            "JOIN FETCH e.course c " +
            "JOIN FETCH c.instructor " +
            "WHERE e.user.id = :userId " +
            "ORDER BY e.enrolledAt DESC")
    List<Enrollment> findByUserIdWithCourseAndInstructor(@Param("userId") Long userId);

    @Query("SELECT COUNT(e) > 0 FROM Enrollment e " +
            "WHERE e.user.email = :email AND e.course.id = :courseId")
    boolean existsByUserEmailAndCourseId(
            @Param("email") String email,
            @Param("courseId") Long courseId
    );

    boolean existsByIdCourseIdAndIdUserId(Long courseId, Long userId);
    boolean existsByUser_IdAndCourse_Id(Long userId, Long courseId);

    @Query("SELECT e FROM Enrollment e " +
           "JOIN FETCH e.user u " +
           "JOIN FETCH e.course c " +
           "WHERE c.instructor.id = :instructorId " +
           "ORDER BY e.enrolledAt DESC")
    List<Enrollment> findByInstructorId(@Param("instructorId") Long instructorId);

    @Query("SELECT COUNT(e) > 0 FROM Enrollment e WHERE e.user.id = :userId AND e.course.id = :courseId")
    boolean existsByUserIdAndCourseId(@Param("userId") Long userId, @Param("courseId") Long courseId);

    @Query("SELECT COUNT(e) FROM Enrollment e WHERE e.course.id = :courseId")
    long countByCourseId(@Param("courseId") Long courseId);

    @Query("SELECT DISTINCT e.user.id FROM Enrollment e")
    List<Long> findDistinctUserIds();

    @Query("SELECT COUNT(DISTINCT e.user.id) FROM Enrollment e")
    long countDistinctUsers();

    @Query("SELECT COUNT(DISTINCT e.user.id) FROM Enrollment e WHERE e.course.instructor.id = :instructorId")
    long countDistinctStudentsByInstructorId(@Param("instructorId") Long instructorId);

    @Query("SELECT COALESCE(AVG(e.progressPercent), 0) FROM Enrollment e WHERE e.course.instructor.id = :instructorId")
    Double findAvgProgressByInstructorId(@Param("instructorId") Long instructorId);

    @Query("SELECT COUNT(e) FROM Enrollment e WHERE e.course.instructor.id = :instructorId AND e.enrolledAt >= :since")
    long countNewEnrollmentsSince(@Param("instructorId") Long instructorId, @Param("since") Instant since);

    @Query("SELECT e FROM Enrollment e " +
            "JOIN FETCH e.user u " +
            "JOIN FETCH e.course c " +
            "WHERE c.instructor.id = :instructorId " +
            "ORDER BY e.enrolledAt DESC")
    List<Enrollment> findRecentByInstructorId(@Param("instructorId") Long instructorId, Pageable pageable);

    interface DailyCountProjection {
        java.time.LocalDate getDay();
        Long getCount();
    }

    @Query(value = """
            SELECT
                date_trunc('day', e.enrolled_at)::date AS day,
                COUNT(e.user_id) AS count
            FROM enrollments e
            JOIN courses c ON c.course_id = e.course_id
            WHERE c.instructor_id = :instructorId AND e.enrolled_at >= :since
            GROUP BY date_trunc('day', e.enrolled_at)
            ORDER BY day
            """, nativeQuery = true)
    List<DailyCountProjection> findDailyNewStudentsByInstructor(
            @Param("instructorId") Long instructorId,
            @Param("since") Instant since
    );

    @Query("SELECT COUNT(e) FROM Enrollment e " +
            "WHERE e.course.instructor.id = :instructorId AND e.enrolledAt < :before")
    long countEnrollmentsByInstructorIdBefore(
            @Param("instructorId") Long instructorId,
            @Param("before") Instant before
    );

    interface CourseProgressProjection {
        Long getCourseId();
        Double getAvgProgress();
    }

    @Query("SELECT e.course.id AS courseId, COALESCE(AVG(e.progressPercent), 0) AS avgProgress " +
            "FROM Enrollment e WHERE e.course.instructor.id = :instructorId GROUP BY e.course.id")
    List<CourseProgressProjection> findAvgProgressByCourseForInstructor(@Param("instructorId") Long instructorId);

    @Query("SELECT COUNT(e) FROM Enrollment e WHERE e.course.instructor.id = :instructorId AND e.progressPercent > 0")
    long countActiveStudentsByInstructorId(@Param("instructorId") Long instructorId);

    @Query("SELECT DISTINCT e.user FROM Enrollment e WHERE e.course.instructor.id = :instructorId")
    List<com.example.back_end.entity.User> findDistinctStudentsByInstructorId(@Param("instructorId") Long instructorId);

    @Query("SELECT DISTINCT e.user FROM Enrollment e WHERE e.course.id = :courseId")
    List<com.example.back_end.entity.User> findDistinctStudentsByCourseId(@Param("courseId") Long courseId);

    interface DailyCompletionProjection {
        java.time.LocalDate getDay();
        Long getCount();
    }

    @Query(value = """
            SELECT
                date_trunc('day', e.completed_at)::date AS day,
                COUNT(*) AS count
            FROM enrollments e
            JOIN courses c ON c.course_id = e.course_id
            WHERE c.instructor_id = :instructorId AND e.completed_at >= :since
            GROUP BY date_trunc('day', e.completed_at)
            ORDER BY day
            """, nativeQuery = true)
    List<DailyCompletionProjection> findDailyCompletionsByInstructor(
            @Param("instructorId") Long instructorId,
            @Param("since") Instant since
    );
    
    Optional<Enrollment> findByUser_IdAndCourse_Id(Long userId, Long courseId);
}