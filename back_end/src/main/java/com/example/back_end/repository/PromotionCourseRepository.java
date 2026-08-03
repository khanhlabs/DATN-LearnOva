package com.example.back_end.repository;

import com.example.back_end.entity.PromotionCourse;
import com.example.back_end.entity.PromotionCourseId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface PromotionCourseRepository extends JpaRepository<PromotionCourse, PromotionCourseId> {

    @Query("SELECT pc FROM PromotionCourse pc JOIN FETCH pc.promotion JOIN FETCH pc.course c WHERE c.instructor.id = :instructorId")
    List<PromotionCourse> findByInstructorId(@Param("instructorId") Long instructorId);

    Optional<PromotionCourse> findByCourse_Id(Long courseId);

    Optional<PromotionCourse> findByPromotion_Id(Long promotionId);

    @Query("SELECT pc FROM PromotionCourse pc JOIN FETCH pc.promotion p WHERE pc.course.id IN :courseIds AND p.startDate <= :now AND p.endDate >= :now")
    List<PromotionCourse> findActivePromotionsByCourseIds(@Param("courseIds") List<Long> courseIds, @Param("now") Instant now);
}
