package com.example.back_end.repository;

import com.example.back_end.entity.PayoutRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;

public interface PayoutRequestRepository extends JpaRepository<PayoutRequest, Long> {

    List<PayoutRequest> findByTeacher_IdOrderByCreatedAtDesc(Long teacherId);

    List<PayoutRequest> findAllByOrderByCreatedAtDesc();

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM PayoutRequest p " +
            "WHERE p.teacher.id = :teacherId AND p.status IN ('PENDING', 'PAID')")
    BigDecimal sumOpenAndPaidByTeacher(@Param("teacherId") Long teacherId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM PayoutRequest p WHERE p.status = 'PENDING'")
    BigDecimal sumPendingAmount();

    @Query("SELECT COUNT(p) FROM PayoutRequest p WHERE p.status = 'PENDING'")
    long countPending();

    boolean existsByTeacher_IdAndNotesContaining(Long teacherId, String marker);

    List<PayoutRequest> findByStatusOrderByCreatedAtAsc(com.example.back_end.entity.enums.PayoutRequestStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM PayoutRequest p JOIN FETCH p.teacher WHERE p.id = :id")
    Optional<PayoutRequest> findByIdForUpdate(@Param("id") Long id);
}
