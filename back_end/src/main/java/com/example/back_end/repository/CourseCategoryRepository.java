package com.example.back_end.repository;

import com.example.back_end.entity.CourseCategory;
import com.example.back_end.entity.CourseCategoryId;
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
