package com.example.back_end.commerce.infrastructure.persistence;

import com.example.back_end.commerce.domain.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findFirstByOrderIdOrderByIdDesc(Long orderId);

    Optional<Payment> findByTransactionId(String transactionId);

}
