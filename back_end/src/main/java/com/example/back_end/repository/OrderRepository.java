package com.example.back_end.repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.example.back_end.entity.Order;
import com.example.back_end.entity.enums.OrderStatus;
import jakarta.persistence.LockModeType;

import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    interface DailyRevenueProjection {
        LocalDate getDay();
        BigDecimal getAmount();
    }

    List<Order> findByStatus(OrderStatus status);

    @Query(value = "SELECT oi.price FROM order_items oi " +
                   "JOIN courses c ON c.course_id = oi.course_id " +
                   "JOIN orders o ON o.order_id = oi.order_id " +
                   "WHERE c.instructor_id = :instructorId " +
                   "AND o.status = 'PAID'", nativeQuery = true)
    List<BigDecimal> findRevenueByInstructor(@Param("instructorId") Long instructorId);

    @Query(value = """
            SELECT
                date_trunc('day', o.created_at)::date AS day,
                COALESCE(SUM(oi.price), 0) AS amount
            FROM order_items oi
            JOIN courses c ON c.course_id = oi.course_id
            JOIN orders o ON o.order_id = oi.order_id AND o.status = 'PAID'
            JOIN payments p ON p.order_id = o.order_id AND p.status = 'SUCCESS'
            WHERE c.instructor_id = :instructorId AND o.created_at >= :since
            GROUP BY date_trunc('day', o.created_at)
            ORDER BY day
            """, nativeQuery = true)
    List<DailyRevenueProjection> findDailyRevenueByInstructor(
            @Param("instructorId") Long instructorId,
            @Param("since") Instant since
    );

    interface CourseRevenueProjection {
        Long getCourseId();
        BigDecimal getAmount();
    }

    @Query(value = """
            SELECT
                c.course_id AS courseId,
                COALESCE(SUM(oi.price), 0) AS amount
            FROM order_items oi
            JOIN courses c ON c.course_id = oi.course_id
            JOIN orders o ON o.order_id = oi.order_id AND o.status = 'PAID'
            JOIN payments p ON p.order_id = o.order_id AND p.status = 'SUCCESS'
            WHERE c.instructor_id = :instructorId
            GROUP BY c.course_id
            """, nativeQuery = true)
    List<CourseRevenueProjection> findRevenueByCourseForInstructor(@Param("instructorId") Long instructorId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM Order o JOIN FETCH o.user WHERE o.id = :orderId")
    Optional<Order> findByIdForPaymentUpdate(@Param("orderId") Long orderId);

    @Query(value = "SELECT COALESCE(SUM(oi.price), 0) FROM order_items oi " +
            "JOIN courses c ON c.course_id = oi.course_id " +
            "JOIN orders o ON o.order_id = oi.order_id " +
            "WHERE c.instructor_id = :instructorId AND o.status = 'PAID'", nativeQuery = true)
    BigDecimal findTotalRevenueByInstructor(@Param("instructorId") Long instructorId);

    @Query(value = "SELECT COUNT(DISTINCT o.order_id) FROM order_items oi " +
            "JOIN courses c ON c.course_id = oi.course_id " +
            "JOIN orders o ON o.order_id = oi.order_id " +
            "WHERE c.instructor_id = :instructorId AND o.status = 'PAID' AND o.created_at >= :since", nativeQuery = true)
    long countOrdersByInstructorSince(@Param("instructorId") Long instructorId, @Param("since") Instant since);

    @Query(value = "SELECT COALESCE(SUM(p.amount), 0) FROM payments p " +
            "JOIN orders o ON o.order_id = p.order_id " +
            "JOIN order_items oi ON oi.order_id = o.order_id " +
            "JOIN courses c ON c.course_id = oi.course_id " +
            "WHERE c.instructor_id = :instructorId AND p.status = 'REFUNDED' AND o.created_at >= :since", nativeQuery = true)
    BigDecimal findRefundsByInstructorSince(@Param("instructorId") Long instructorId, @Param("since") Instant since);

    @Query(value = "SELECT COALESCE(SUM(p.amount), 0) FROM payments p " +
            "JOIN orders o ON o.order_id = p.order_id " +
            "JOIN order_items oi ON oi.order_id = o.order_id " +
            "JOIN courses c ON c.course_id = oi.course_id " +
            "WHERE c.instructor_id = :instructorId AND p.status = 'REFUNDED'", nativeQuery = true)
    BigDecimal findLifetimeRefundsByInstructor(@Param("instructorId") Long instructorId);

    interface TransactionProjection {
        Long getOrderId();
        String getStudentName();
        String getStudentAvatar();
        String getCourseTitle();
        BigDecimal getPrice();
        String getPaymentMethod();
        Instant getPaidAt();
    }

    @Query(value = """
            SELECT
                o.order_id AS orderId,
                u.full_name AS studentName,
                u.avatar AS studentAvatar,
                c.title AS courseTitle,
                oi.price AS price,
                p.payment_method AS paymentMethod,
                o.created_at AS paidAt
            FROM order_items oi
            JOIN courses c ON c.course_id = oi.course_id
            JOIN orders o ON o.order_id = oi.order_id AND o.status = 'PAID'
            JOIN users u ON u.user_id = o.user_id
            JOIN payments p ON p.order_id = o.order_id AND p.status = 'SUCCESS'
            WHERE c.instructor_id = :instructorId
            ORDER BY o.created_at DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<TransactionProjection> findRecentTransactionsByInstructor(
            @Param("instructorId") Long instructorId,
            @Param("limit") int limit
    );
}
