package com.example.back_end.repository.admin;

import com.example.back_end.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.math.BigDecimal;

public interface AdminCourseRepository extends JpaRepository<Course, Long> {

    @Query("""
            SELECT DISTINCT c FROM Course c
            JOIN FETCH c.instructor
            LEFT JOIN FETCH c.courseCategories cc
            LEFT JOIN FETCH cc.category
            """)
    List<Course> findAllWithInstructor();

    @Query("SELECT c FROM Course c WHERE c.instructor.id IN :instructorIds AND c.isDeleted = false")
    List<Course> findByInstructorIdIn(@Param("instructorIds") List<Long> instructorIds);

    long countByIsDeletedFalse();

    @Query(value = """
            SELECT COALESCE(SUM(oi.price), 0)
            FROM order_items oi
            JOIN orders o ON o.order_id = oi.order_id
            JOIN courses c ON c.course_id = oi.course_id
            WHERE CAST(o.status AS text) = 'PAID'
              AND c.is_deleted = false
            """, nativeQuery = true)
    BigDecimal sumPaidRevenue();

    @Query(value = """
            SELECT
              c.course_id,
              c.title,
              c.created_at
            FROM courses c
            WHERE c.is_deleted = false
            ORDER BY c.created_at DESC
            LIMIT 4
            """, nativeQuery = true)
    List<Object[]> findRecentCourseActivityRows();

    @Query(value = """
            SELECT
              u.user_id,
              u.full_name,
              u.email,
              u.avatar,
              (
                SELECT COUNT(*)
                FROM courses c
                WHERE c.instructor_id = u.user_id
                  AND c.is_deleted = false
              ) AS course_count,
              (
                SELECT COALESCE(AVG(rv.rating), 0)
                FROM reviews rv
                JOIN courses c ON c.course_id = rv.course_id
                WHERE c.instructor_id = u.user_id
                  AND c.is_deleted = false
              ) AS average_rating,
              (
                SELECT COALESCE(SUM(oi.price), 0)
                FROM order_items oi
                JOIN orders o ON o.order_id = oi.order_id
                JOIN courses c ON c.course_id = oi.course_id
                WHERE c.instructor_id = u.user_id
                  AND c.is_deleted = false
                  AND CAST(o.status AS text) = 'PAID'
              ) AS total_revenue,
              (
                SELECT COUNT(DISTINCT e.user_id)
                FROM enrollments e
                JOIN courses c ON c.course_id = e.course_id
                WHERE c.instructor_id = u.user_id
                  AND c.is_deleted = false
              ) AS total_students
            FROM users u
            WHERE u.is_deleted = false
              AND EXISTS (
                SELECT 1
                FROM user_role ur
                JOIN roles r ON r.role_id = ur.role_id
                WHERE ur.user_id = u.user_id
                  AND CAST(r.role_name AS text) = 'ROLE_TEACHER'
              )
            ORDER BY total_revenue DESC, total_students DESC, course_count DESC, u.created_at DESC
            LIMIT 4
            """, nativeQuery = true)
    List<Object[]> findFeaturedInstructorRows();

    @Query("""
            SELECT DISTINCT c FROM Course c
            JOIN FETCH c.instructor
            LEFT JOIN FETCH c.tags
            LEFT JOIN FETCH c.sections s
            LEFT JOIN FETCH s.lessons
            LEFT JOIN FETCH c.courseCategories cc
            LEFT JOIN FETCH cc.category
            WHERE c.id = :id
            """)
    Optional<Course> findByIdWithDetail(@Param("id") Long id);
}
