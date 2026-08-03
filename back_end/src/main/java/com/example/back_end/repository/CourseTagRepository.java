package com.example.back_end.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.back_end.entity.CourseTag;
import com.example.back_end.entity.CourseTagId;

public interface CourseTagRepository extends JpaRepository<CourseTag, CourseTagId> {

    @Query("SELECT ct FROM CourseTag ct JOIN FETCH ct.course")
    List<CourseTag> findAllWithCourse();

    @Query("SELECT ct FROM CourseTag ct JOIN FETCH ct.course WHERE ct.id.tagId = :tagId")
    List<CourseTag> findByTagIdWithCourse(@Param("tagId") Long tagId);

    @Query("SELECT ct FROM CourseTag ct WHERE ct.id.tagId = :tagId")
    List<CourseTag> findByTagId(@Param("tagId") Long tagId);

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM CourseTag ct WHERE ct.id.tagId = :tagId")
    void deleteByTagId(@Param("tagId") Long tagId);
}
