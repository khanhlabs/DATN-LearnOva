package com.example.back_end.course.infrastructure.persistence;

import com.example.back_end.course.domain.CourseCategory;
import com.example.back_end.course.domain.CourseCategoryId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CourseCategoryRepository extends JpaRepository<CourseCategory, CourseCategoryId> {

    @Query("SELECT cc FROM CourseCategory cc JOIN FETCH cc.category WHERE cc.course.id IN :courseIds")
    List<CourseCategory> findByCourseIdInWithCategory(@Param("courseIds") List<Long> courseIds);

    @Modifying
    @Query("DELETE FROM CourseCategory cc WHERE cc.course.id = :courseId")
    void deleteByCourseId(@Param("courseId") Long courseId);
}
