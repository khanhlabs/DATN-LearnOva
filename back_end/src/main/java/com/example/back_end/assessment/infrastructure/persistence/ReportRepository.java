package com.example.back_end.assessment.infrastructure.persistence;

import com.example.back_end.assessment.domain.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {

    List<Report> findAllByOrderByCreatedAtDesc();

    boolean existsByReporter_IdAndCourse_IdAndStatus(Long reporterId, Long courseId, String status);

    @Query("""
            SELECT COUNT(r) FROM Report r
            WHERE r.course.id = :courseId
              AND r.reason = :reason
              AND (:lessonId IS NULL OR r.lesson.id IS NULL OR r.lesson.id = :lessonId)
            """)
    long countSameReason(
            @Param("courseId") Long courseId,
            @Param("reason") String reason,
            @Param("lessonId") Long lessonId
    );

    long countByCourse_Id(Long courseId);
}
