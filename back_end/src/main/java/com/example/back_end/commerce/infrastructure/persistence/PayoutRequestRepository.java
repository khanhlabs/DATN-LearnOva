package com.example.back_end.commerce.infrastructure.persistence;

import com.example.back_end.commerce.domain.PayoutRequest;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PayoutRequestRepository extends JpaRepository<PayoutRequest, Long> {

    boolean existsByTeacher_IdAndNotesContaining(Long teacherId, String marker);
}
