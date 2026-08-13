package com.example.back_end.commerce.infrastructure.persistence;

import com.example.back_end.commerce.domain.Payment;
import com.example.back_end.commerce.domain.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findFirstByOrderIdOrderByIdDesc(Long orderId);

    Optional<Payment> findByTransactionId(String transactionId);

    @Query("SELECT p FROM Payment p JOIN FETCH p.order WHERE p.status = :status")
    List<Payment> findByStatusWithOrder(@Param("status") PaymentStatus status);
}
