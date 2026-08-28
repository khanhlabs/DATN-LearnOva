package com.example.back_end.commerce.infrastructure.persistence;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.example.back_end.commerce.domain.Order;
import com.example.back_end.commerce.domain.enums.OrderStatus;
import jakarta.persistence.LockModeType;

import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    @Query(value = """
            SELECT DISTINCT o.*
            FROM orders o
            LEFT JOIN order_items oi ON oi.order_id = o.order_id
            LEFT JOIN courses c ON c.course_id = oi.course_id
            JOIN payments p ON p.order_id = o.order_id
            WHERE o.user_id = :userId
              AND (CAST(:status AS text) IS NULL OR CAST(o.status AS text) = CAST(:status AS text) OR CAST(p.status AS text) = CAST(:status AS text))
              AND (CAST(:fromDate AS timestamp with time zone) IS NULL OR o.created_at >= CAST(:fromDate AS timestamp with time zone))
              AND (CAST(:toDate AS timestamp with time zone) IS NULL OR o.created_at < CAST(:toDate AS timestamp with time zone))
              AND (CAST(:search AS text) IS NULL OR CAST(o.order_id AS text) ILIKE CONCAT('%', CAST(:search AS text), '%')
                   OR c.title ILIKE CONCAT('%', CAST(:search AS text), '%'))
            ORDER BY o.created_at DESC
            """,
            countQuery = """
            SELECT COUNT(DISTINCT o.order_id)
            FROM orders o
            LEFT JOIN order_items oi ON oi.order_id = o.order_id
            LEFT JOIN courses c ON c.course_id = oi.course_id
            JOIN payments p ON p.order_id = o.order_id
            WHERE o.user_id = :userId
              AND (CAST(:status AS text) IS NULL OR CAST(o.status AS text) = CAST(:status AS text) OR CAST(p.status AS text) = CAST(:status AS text))
              AND (CAST(:fromDate AS timestamp with time zone) IS NULL OR o.created_at >= CAST(:fromDate AS timestamp with time zone))
              AND (CAST(:toDate AS timestamp with time zone) IS NULL OR o.created_at < CAST(:toDate AS timestamp with time zone))
              AND (CAST(:search AS text) IS NULL OR CAST(o.order_id AS text) ILIKE CONCAT('%', CAST(:search AS text), '%')
                   OR c.title ILIKE CONCAT('%', CAST(:search AS text), '%'))
            """,
            nativeQuery = true)
    Page<Order> findPaymentHistory(
            @Param("userId") Long userId,
            @Param("status") String status,
            @Param("fromDate") Instant fromDate,
            @Param("toDate") Instant toDate,
            @Param("search") String search,
            Pageable pageable
    );

    Optional<Order> findByIdAndUserId(Long id, Long userId);

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

    interface InstructorEarningProjection {
        Long getOrderItemId();
        Long getOrderId();
        Long getPaymentId();
        String getTransactionId();
        String getStudentName();
        String getCourseTitle();
        BigDecimal getPaidAmount();
        Instant getPaidAt();
        String getPaymentStatus();
    }

    /**
     * One row per order item for this instructor (SUCCESS payment + PAID order).
     * DISTINCT ON order_item_id avoids duplicate rows if multiple SUCCESS payments exist.
     * paidAmount is the line share of payments.amount (VND), proportional to oi.price.
     */
    @Query(value = """
            SELECT DISTINCT ON (oi.order_item_id)
                oi.order_item_id AS "orderItemId",
                o.order_id AS "orderId",
                p.payment_id AS "paymentId",
                CONCAT('PAY-', p.payment_id) AS "transactionId",
                u.full_name AS "studentName",
                c.title AS "courseTitle",
                COALESCE(
                    ROUND(
                        p.amount * oi.price / NULLIF((
                            SELECT SUM(oi2.price)
                            FROM order_items oi2
                            WHERE oi2.order_id = o.order_id
                        ), 0)
                    , 0),
                    p.amount
                ) AS "paidAmount",
                COALESCE(p.paid_at, o.created_at) AS "paidAt",
                p.status AS "paymentStatus"
            FROM order_items oi
            JOIN courses c ON c.course_id = oi.course_id AND c.is_deleted = FALSE
            JOIN orders o ON o.order_id = oi.order_id AND o.status = 'PAID'
            JOIN users u ON u.user_id = o.user_id
            JOIN payments p ON p.order_id = o.order_id AND p.status = 'SUCCESS'
            WHERE c.instructor_id = :instructorId
            ORDER BY oi.order_item_id, COALESCE(p.paid_at, o.created_at) DESC
            """, nativeQuery = true)
    List<InstructorEarningProjection> findEarningsByInstructor(@Param("instructorId") Long instructorId);

    @Query(value = """
            SELECT
                oi.order_item_id AS "orderItemId",
                o.order_id AS "orderId",
                p.payment_id AS "paymentId",
                CONCAT('PAY-', p.payment_id) AS "transactionId",
                u.full_name AS "studentName",
                c.title AS "courseTitle",
                COALESCE(
                    ROUND(
                        p.amount * oi.price / NULLIF((
                            SELECT SUM(oi2.price)
                            FROM order_items oi2
                            WHERE oi2.order_id = o.order_id
                        ), 0)
                    , 0),
                    p.amount
                ) AS "paidAmount",
                COALESCE(p.paid_at, o.created_at) AS "paidAt",
                p.status AS "paymentStatus"
            FROM order_items oi
            JOIN courses c ON c.course_id = oi.course_id AND c.is_deleted = FALSE
            JOIN orders o ON o.order_id = oi.order_id AND o.status = 'PAID'
            JOIN users u ON u.user_id = o.user_id
            JOIN payments p ON p.order_id = o.order_id AND p.status = 'SUCCESS'
            WHERE c.instructor_id = :instructorId
              AND oi.order_item_id = :orderItemId
            ORDER BY COALESCE(p.paid_at, o.created_at) DESC
            LIMIT 1
            """, nativeQuery = true)
    InstructorEarningProjection findEarningByInstructorAndOrderItem(
            @Param("instructorId") Long instructorId,
            @Param("orderItemId") Long orderItemId
    );
}
