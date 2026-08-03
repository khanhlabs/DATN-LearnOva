package com.example.back_end.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SectionRepository extends JpaRepository<Section, Long> {
    List<Section> findByCourseIdOrderBySectionOrderAsc(Long courseId);
}
