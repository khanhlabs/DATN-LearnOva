package com.example.back_end.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.back_end.entity.LessonQA;

public interface LessonQARepository extends JpaRepository<LessonQA, Long> {

    List<LessonQA> findByLesson_IdAndParentIsNull(Long lessonId);

    List<LessonQA> findByParent_IdIn(List<Long> parentIds);

    List<LessonQA> findByLesson_Id(Long lessonId);

    List<LessonQA> findByLessonIdAndIsDeletedFalse(Long lessonId);
    List<LessonQA> findByRootId(Long rootId);

    @Query("SELECT q FROM LessonQA q JOIN FETCH q.user WHERE q.lesson.section.course.id = :courseId AND q.parent IS NULL")
    List<LessonQA> findQuestionsForCourseWithUser(@Param("courseId") Long courseId);

    @Query("SELECT a FROM LessonQA a JOIN FETCH a.user WHERE a.parent.id IN :parentIds")
    List<LessonQA> findAnswersByParentIdsWithUser(@Param("parentIds") List<Long> parentIds);

    @Query("SELECT COUNT(q) FROM LessonQA q WHERE q.type = 'QUESTION' AND q.isSolved = false " +
            "AND q.isDeleted = false AND q.lesson.section.course.instructor.id = :instructorId")
    long countUnsolvedQuestionsByInstructor(@Param("instructorId") Long instructorId);

    @Query("SELECT COUNT(q) FROM LessonQA q WHERE q.type = 'QUESTION' " +
            "AND q.isDeleted = false AND q.lesson.section.course.instructor.id = :instructorId")
    long countQuestionsByInstructor(@Param("instructorId") Long instructorId);

    @Query("SELECT q FROM LessonQA q " +
            "JOIN FETCH q.user " +
            "JOIN FETCH q.lesson l " +
            "JOIN FETCH l.section s " +
            "JOIN FETCH s.course c " +
            "WHERE q.type = 'QUESTION' AND q.isDeleted = false AND c.instructor.id = :instructorId " +
            "ORDER BY q.isPinned DESC, q.createdAt DESC")
    List<LessonQA> findQuestionsForInstructorWithDetails(@Param("instructorId") Long instructorId);
}