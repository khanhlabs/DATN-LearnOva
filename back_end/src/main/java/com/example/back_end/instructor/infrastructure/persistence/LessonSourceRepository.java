package com.example.back_end.instructor.infrastructure.persistence;

import com.example.back_end.course.domain.LessonSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LessonSourceRepository extends JpaRepository<LessonSource, Long> {
    List<LessonSource> findByLessonId(Long lessonId);
}
