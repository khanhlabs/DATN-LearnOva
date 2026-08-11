package com.example.back_end.instructor.infrastructure.persistence;

import com.example.back_end.commerce.domain.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PromotionRepository extends JpaRepository<Promotion, Long> {
}
