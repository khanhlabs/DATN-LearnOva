package com.example.back_end.assessment.infrastructure.persistence;

import com.example.back_end.assessment.domain.ReportCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReportCategoryRepository extends JpaRepository<ReportCategory, Long> {
    Optional<ReportCategory> findByCode(String code);
}
