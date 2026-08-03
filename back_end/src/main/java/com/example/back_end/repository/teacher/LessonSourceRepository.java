package com.example.back_end.repository.teacher;

import com.example.back_end.entity.LessonSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LessonSourceRepository extends JpaRepository<LessonSource, Long> {
    List<LessonSource> findByLessonId(Long lessonId);
}
