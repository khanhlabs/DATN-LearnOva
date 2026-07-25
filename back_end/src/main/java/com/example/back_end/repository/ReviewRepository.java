package com.example.back_end.repository;

import com.example.back_end.entity.Review;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByCourseId(Long courseId);

    Optional<Review> findByUserIdAndCourseId(Long userId, Long courseId);

    @Query("SELECT r FROM Review r JOIN FETCH r.user WHERE r.course.id = :courseId")
    List<Review> findByCourseIdWithUser(@Param("courseId") Long courseId);

    @Query("SELECT r FROM Review r WHERE r.course.id IN :courseIds")
    List<Review> findByCourseIdIn(@Param("courseIds") List<Long> courseIds);

    @Query("SELECT r FROM Review r JOIN FETCH r.user JOIN FETCH r.course WHERE r.course.id IN :courseIds ORDER BY r.createdAt DESC")
    List<Review> findByCourseIdInWithUserAndCourse(@Param("courseIds") List<Long> courseIds);
    @Query("SELECT COALESCE(AVG(r.rating), 0) FROM Review r WHERE r.course.id = :courseId")
    Double getAverageRating(@Param("courseId") Long courseId);

    @Query("SELECT COALESCE(AVG(r.rating), 0) FROM Review r WHERE r.course.instructor.id = :instructorId")
    Double getAverageRatingByInstructorId(@Param("instructorId") Long instructorId);

    long countByCourseId(Long courseId);

    long countByCourseInstructorId(Long instructorId);

    long countByCourseInstructorIdAndCreatedAtGreaterThanEqual(Long instructorId, Instant since);

    interface CourseRatingProjection {
        Long getCourseId();
        Double getAvgRating();
        Long getRatingCount();
    }

    @Query("SELECT r.course.id AS courseId, AVG(r.rating) AS avgRating, COUNT(r) AS ratingCount " +
            "FROM Review r WHERE r.course.instructor.id = :instructorId GROUP BY r.course.id")
    List<CourseRatingProjection> findAvgRatingByCourseForInstructor(@Param("instructorId") Long instructorId);

    @Query("SELECT r.course.id AS courseId, AVG(r.rating) AS avgRating, COUNT(r) AS ratingCount " +
            "FROM Review r WHERE r.course.id IN :courseIds GROUP BY r.course.id")
    List<CourseRatingProjection> findAvgRatingByCourseIds(@Param("courseIds") List<Long> courseIds);

    @Query("SELECT r FROM Review r JOIN FETCH r.user JOIN FETCH r.course " +
            "WHERE r.course.instructor.id = :instructorId ORDER BY r.createdAt DESC")
    List<Review> findRecentByInstructorId(@Param("instructorId") Long instructorId, Pageable pageable);

    @Query("SELECT COALESCE(AVG(r.rating), 0) FROM Review r")
    double getPlatformAverageRating();

    @Query("SELECT r FROM Review r JOIN FETCH r.user JOIN FETCH r.course " +
            "WHERE r.rating >= 4 AND r.comment IS NOT NULL AND LENGTH(TRIM(r.comment)) >= 5 " +
            "ORDER BY r.rating DESC, r.createdAt DESC")
    List<Review> findTopTestimonials(Pageable pageable);
}