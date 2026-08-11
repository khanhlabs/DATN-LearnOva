package com.example.back_end.course.infrastructure.persistence;

import com.example.back_end.course.domain.Course;
import com.example.back_end.course.domain.enums.CourseStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CourseRepository extends JpaRepository<Course, Long> {

    long countByInstructorIdAndIsDeletedFalse(Long instructorId);

    long countByStatusAndIsDeletedFalse(CourseStatus status);

    @Query("""
            SELECT DISTINCT c FROM Course c
            LEFT JOIN FETCH c.sections s
            LEFT JOIN FETCH s.lessons
            LEFT JOIN FETCH c.courseCategories cc
            LEFT JOIN FETCH cc.category
            WHERE c.instructor.id = :instructorId AND c.isDeleted = false
            ORDER BY c.createdAt DESC
            """)
    List<Course> findByInstructorIdAndIsDeletedFalseOrderByCreatedAtDesc(@Param("instructorId") Long instructorId);

    @Query("""
            SELECT DISTINCT c FROM Course c
            LEFT JOIN FETCH c.sections s
            LEFT JOIN FETCH s.lessons
            LEFT JOIN FETCH c.courseCategories cc
            LEFT JOIN FETCH cc.category
            WHERE c.status = :status AND c.isDeleted = false AND c.isHidden = false
            """)
    List<Course> findAllByStatus(@Param("status") CourseStatus status);

    @Query("""
            SELECT DISTINCT c FROM Course c
            LEFT JOIN FETCH c.instructor
            LEFT JOIN FETCH c.sections s
            LEFT JOIN FETCH s.lessons
            LEFT JOIN FETCH c.courseCategories cc
            LEFT JOIN FETCH cc.category
            WHERE c.id = :id AND c.isDeleted = false
            """)
    Optional<Course> findCourseDetailById(@Param("id") Long id);

    List<Course> findByStatusAndIsDeletedFalseAndIsHiddenFalseOrderByCreatedAtDesc(CourseStatus status);
    List<Course> findByStatusAndIsDeletedFalseOrderByCreatedAtDesc(CourseStatus status);

    List<Course> findByInstructorIdAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(
            Long instructorId, CourseStatus status);
    @Query("""
    SELECT DISTINCT c
    FROM Course c
    LEFT JOIN FETCH c.sections s
    LEFT JOIN FETCH s.lessons
    WHERE c.id = :courseId
""")
    Optional<Course> findCurriculumById(@Param("courseId") Long courseId);

    long countByInstructorIdAndStatusAndIsDeletedFalseAndIsHiddenFalse(Long instructorId, CourseStatus status);

    @Query("""
            SELECT DISTINCT c FROM Course c
            LEFT JOIN FETCH c.sections s
            LEFT JOIN FETCH s.lessons
            LEFT JOIN FETCH c.courseCategories cc
            LEFT JOIN FETCH cc.category
            WHERE c.instructor.id = :instructorId AND c.status = :status
                AND c.isDeleted = false AND c.isHidden = false
            ORDER BY c.createdAt DESC
            """)
    List<Course> findByInstructorIdAndStatusAndIsDeletedFalseAndIsHiddenFalse(
            @Param("instructorId") Long instructorId,
            @Param("status") CourseStatus status
    );

}
