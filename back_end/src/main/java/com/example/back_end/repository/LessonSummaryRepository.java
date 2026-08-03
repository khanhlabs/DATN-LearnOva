package com.example.back_end.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LessonSummaryRepository extends JpaRepository<LessonSummary, Long> {
    Optional<LessonSummary> findByLessonId(Long lessonId);
}
