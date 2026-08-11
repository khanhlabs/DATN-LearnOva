package com.example.back_end.admin.infrastructure.persistence;

import com.example.back_end.commerce.domain.OrderItem;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AdminRevenueRepository extends JpaRepository<OrderItem, Long> {

    interface CourseRankingProjection {
        Long getCourseId();
        String getTitle();
        Long getInstructorId();
        String getInstructor();
        Long getCategoryId();
        String getCategory();
        Long getStudents();
        BigDecimal getRevenue();
        BigDecimal getShare();
    }

    interface InstructorRankingProjection {
        Long getInstructorId();
        String getInstructor();
        Long getTotalCourses();
        Long getTotalStudents();
        BigDecimal getRevenue();
        BigDecimal getAvgPerCourse();
        BigDecimal getShare();
    }

    interface CategoryRevenueProjection {
        Long getCategoryId();
        String getCategoryName();
        BigDecimal getAmount();
    }

    interface PeriodAmountProjection {
        LocalDate getPeriod();
        BigDecimal getAmount();
    }

    interface TransactionLogProjection {
        Long getOrderId();
        Long getPaymentId();
        Long getOrderItemId();
        String getTransactionId();
        String getStudentName();
        String getCourseName();
        Long getCategoryId();
        String getCategoryName();
        String getPaymentMethod();
        BigDecimal getAmount();
        String getCurrency();
        String getStatus();
        Instant getPaidAt();
    }

    interface PeakDayProjection {
        LocalDate getDay();
        BigDecimal getAmount();
    }

    interface PeakMonthProjection {
        LocalDate getMonthStart();
        BigDecimal getAmount();
    }

    @Query(
            value = """
                    SELECT
                        ranked.course_id AS "courseId",
                        ranked.title AS title,
                        ranked.instructor_id AS "instructorId",
                        ranked.instructor AS instructor,
                        ranked.category_id AS "categoryId",
                        ranked.category AS category,
                        ranked.students AS students,
                        ranked.revenue AS revenue,
                        ROUND((ranked.revenue / NULLIF(SUM(ranked.revenue) OVER (), 0)) * 100, 2) AS share
                    FROM (
                        SELECT
                            c.course_id,
                            c.title,
                            u.user_id AS instructor_id,
                            u.full_name AS instructor,
                            cate.category_id,
                            cate.name AS category,
                            COUNT(DISTINCT e.user_id) AS students,
                            COALESCE(SUM(
                                CASE
                                    WHEN item_totals.item_sum > 0
                                        THEN p.amount * (oi.price / item_totals.item_sum)
                                    ELSE 0
                                END
                            ), 0) AS revenue
                        FROM courses c
                        LEFT JOIN users u
                               ON c.instructor_id = u.user_id
                        LEFT JOIN LATERAL (
                            SELECT cat.category_id, cat.name
                            FROM course_categories cc0
                            JOIN categories cat ON cat.category_id = cc0.category_id
                            WHERE cc0.course_id = c.course_id
                              AND cat.is_deleted = FALSE
                            ORDER BY cc0.is_primary DESC, cat.category_id
                            LIMIT 1
                        ) cate ON TRUE
                        JOIN order_items oi
                               ON c.course_id = oi.course_id
                        JOIN orders o
                               ON oi.order_id = o.order_id
                              AND o.status = 'PAID'
                        JOIN payments p
                               ON p.payment_id = (
                                    SELECT p2.payment_id
                                    FROM payments p2
                                    WHERE p2.order_id = o.order_id
                                      AND p2.status = 'SUCCESS'
                                    ORDER BY p2.payment_id DESC
                                    LIMIT 1
                               )
                        JOIN (
                                SELECT oi2.order_id AS order_id, SUM(oi2.price) AS item_sum
                                FROM order_items oi2
                                GROUP BY oi2.order_id
                        ) item_totals ON item_totals.order_id = o.order_id
                        LEFT JOIN enrollments e
                               ON c.course_id = e.course_id
                        WHERE c.is_deleted = FALSE
                        GROUP BY
                            c.course_id,
                            c.title,
                            u.user_id,
                            u.full_name,
                            cate.category_id,
                            cate.name
                    ) ranked
                    ORDER BY ranked.revenue DESC
                    """,
            countQuery = """
                    SELECT COUNT(*)
                    FROM (
                        SELECT
                            c.course_id
                        FROM courses c
                        JOIN order_items oi
                               ON c.course_id = oi.course_id
                        JOIN orders o
                               ON oi.order_id = o.order_id
                              AND o.status = 'PAID'
                        JOIN payments p
                               ON p.order_id = o.order_id
                              AND p.status = 'SUCCESS'
                        WHERE c.is_deleted = FALSE
                        GROUP BY c.course_id
                    ) counted
                    """,
            nativeQuery = true
    )
    Page<CourseRankingProjection> findTopRevenueCourses(Pageable pageable);

    @Query(
            value = """
                    SELECT
                        ranked.instructor_id AS "instructorId",
                        ranked.instructor AS instructor,
                        ranked.total_courses AS "totalCourses",
                        ranked.total_students AS "totalStudents",
                        ranked.revenue AS revenue,
                        ranked.avg_per_course AS "avgPerCourse",
                        ROUND((ranked.revenue / NULLIF(SUM(ranked.revenue) OVER (), 0)) * 100, 2) AS share
                    FROM (
                        SELECT
                            u.user_id AS instructor_id,
                            u.full_name AS instructor,
                            COUNT(DISTINCT c.course_id) AS total_courses,
                            COUNT(DISTINCT e.user_id) AS total_students,
                            COALESCE(SUM(
                                CASE
                                    WHEN item_totals.item_sum > 0
                                        THEN p.amount * (oi.price / item_totals.item_sum)
                                    ELSE 0
                                END
                            ), 0) AS revenue,
                            ROUND(
                                COALESCE(SUM(
                                    CASE
                                        WHEN item_totals.item_sum > 0
                                            THEN p.amount * (oi.price / item_totals.item_sum)
                                        ELSE 0
                                    END
                                ), 0) /
                                NULLIF(COUNT(DISTINCT c.course_id), 0),
                                2
                            ) AS avg_per_course
                        FROM users u
                        JOIN user_role ur
                          ON ur.user_id = u.user_id
                        JOIN roles r
                          ON r.role_id = ur.role_id
                        LEFT JOIN courses c
                          ON c.instructor_id = u.user_id
                         AND c.is_deleted = FALSE
                        JOIN order_items oi
                          ON oi.course_id = c.course_id
                        JOIN orders o
                          ON o.order_id = oi.order_id
                         AND o.status = 'PAID'
                        JOIN payments p
                          ON p.payment_id = (
                                SELECT p2.payment_id
                                FROM payments p2
                                WHERE p2.order_id = o.order_id
                                  AND p2.status = 'SUCCESS'
                                ORDER BY p2.payment_id DESC
                                LIMIT 1
                          )
                        JOIN (
                                SELECT oi2.order_id AS order_id, SUM(oi2.price) AS item_sum
                                FROM order_items oi2
                                GROUP BY oi2.order_id
                        ) item_totals ON item_totals.order_id = o.order_id
                        LEFT JOIN enrollments e
                          ON e.course_id = c.course_id
                        WHERE r.role_name = 'ROLE_TEACHER'
                        GROUP BY
                            u.user_id,
                            u.full_name
                    ) ranked
                    ORDER BY ranked.revenue DESC
                    """,
            countQuery = """
                    SELECT COUNT(*)
                    FROM (
                        SELECT u.user_id
                        FROM users u
                        JOIN user_role ur
                          ON ur.user_id = u.user_id
                        JOIN roles r
                          ON r.role_id = ur.role_id
                        LEFT JOIN courses c
                          ON c.instructor_id = u.user_id
                         AND c.is_deleted = FALSE
                        JOIN order_items oi
                          ON oi.course_id = c.course_id
                        JOIN orders o
                          ON o.order_id = oi.order_id
                         AND o.status = 'PAID'
                        JOIN payments p
                          ON p.order_id = o.order_id
                         AND p.status = 'SUCCESS'
                        WHERE r.role_name = 'ROLE_TEACHER'
                        GROUP BY u.user_id
                    ) counted
                    """,
            nativeQuery = true
    )
    Page<InstructorRankingProjection> findTopEarningInstructors(Pageable pageable);

    @Query(value = """
            SELECT COALESCE(SUM(oi.price), 0)
            FROM order_items oi
            JOIN orders o ON o.order_id = oi.order_id
            JOIN courses c ON c.course_id = oi.course_id
            WHERE o.status = 'PAID'
              AND c.is_deleted = FALSE
              AND EXISTS (
                    SELECT 1
                    FROM payments p
                    WHERE p.order_id = o.order_id
                      AND p.status = 'SUCCESS'
              )
            """, nativeQuery = true)
    BigDecimal sumPaidItemRevenueAllTime();

    @Query(value = """
            SELECT COALESCE(SUM(oi.price), 0)
            FROM order_items oi
            JOIN orders o ON o.order_id = oi.order_id
            JOIN courses c ON c.course_id = oi.course_id
            WHERE o.status = 'PAID'
              AND c.is_deleted = FALSE
              AND o.created_at >= :fromTs
              AND o.created_at < :toTs
              AND EXISTS (
                    SELECT 1
                    FROM payments p
                    WHERE p.order_id = o.order_id
                      AND p.status = 'SUCCESS'
              )
            """, nativeQuery = true)
    BigDecimal sumPaidItemRevenueBetween(
            @Param("fromTs") Instant fromTs,
            @Param("toTs") Instant toTs
    );

    @Query(value = """
            SELECT COALESCE(SUM(p.amount), 0)
            FROM payments p
            WHERE p.status = 'SUCCESS'
            """, nativeQuery = true)
    BigDecimal sumSuccessfulPaymentAmountAllTime();

    @Query(value = """
            SELECT COALESCE(SUM(p.amount), 0)
            FROM payments p
            WHERE p.status = 'SUCCESS'
              AND COALESCE(p.paid_at, CAST(p.updated_at AS timestamptz)) >= :fromTs
              AND COALESCE(p.paid_at, CAST(p.updated_at AS timestamptz)) < :toTs
            """, nativeQuery = true)
    BigDecimal sumSuccessfulPaymentAmountBetween(
            @Param("fromTs") Instant fromTs,
            @Param("toTs") Instant toTs
    );

    @Query(value = """
            SELECT COUNT(DISTINCT p.payment_id)
            FROM payments p
            WHERE p.status = 'SUCCESS'
            """, nativeQuery = true)
    long countSuccessfulPaymentsAllTime();

    @Query(value = """
            SELECT COUNT(DISTINCT p.payment_id)
            FROM payments p
            WHERE p.status = 'SUCCESS'
              AND COALESCE(p.paid_at, CAST(p.updated_at AS timestamptz)) >= :fromTs
              AND COALESCE(p.paid_at, CAST(p.updated_at AS timestamptz)) < :toTs
            """, nativeQuery = true)
    long countSuccessfulPaymentsBetween(
            @Param("fromTs") Instant fromTs,
            @Param("toTs") Instant toTs
    );

    @Query(value = """
            SELECT COUNT(*)
            FROM payments p
            WHERE p.status = 'REFUNDED'
            """, nativeQuery = true)
    long countRefundedPaymentsAllTime();

    @Query(value = """
            SELECT COUNT(*)
            FROM payments p
            WHERE p.status = 'REFUNDED'
              AND COALESCE(p.paid_at, CAST(p.updated_at AS timestamptz)) >= :fromTs
              AND COALESCE(p.paid_at, CAST(p.updated_at AS timestamptz)) < :toTs
            """, nativeQuery = true)
    long countRefundedPaymentsBetween(
            @Param("fromTs") Instant fromTs,
            @Param("toTs") Instant toTs
    );

    @Query(value = """
            SELECT
                COALESCE(cate.category_id, 0) AS "categoryId",
                COALESCE(cate.name, 'Uncategorized') AS "categoryName",
                COALESCE(SUM(
                    CASE
                        WHEN item_totals.item_sum > 0
                            THEN p.amount * (oi.price / item_totals.item_sum) / GREATEST(COALESCE(cat_counts.cat_count, 1), 1)
                        ELSE 0
                    END
                ), 0) AS amount
            FROM payments p
            JOIN orders o ON o.order_id = p.order_id
            JOIN order_items oi ON oi.order_id = o.order_id
            JOIN courses c ON c.course_id = oi.course_id AND c.is_deleted = FALSE
            LEFT JOIN course_categories cc ON cc.course_id = c.course_id
            LEFT JOIN categories cate ON cate.category_id = cc.category_id AND cate.is_deleted = FALSE
            JOIN (
                    SELECT oi2.order_id AS order_id, SUM(oi2.price) AS item_sum
                    FROM order_items oi2
                    GROUP BY oi2.order_id
            ) item_totals ON item_totals.order_id = o.order_id
            LEFT JOIN (
                    SELECT course_id, COUNT(*) AS cat_count
                    FROM course_categories
                    GROUP BY course_id
            ) cat_counts ON cat_counts.course_id = c.course_id
            WHERE p.status = 'SUCCESS'
            GROUP BY COALESCE(cate.category_id, 0), COALESCE(cate.name, 'Uncategorized')
            ORDER BY amount DESC
            """, nativeQuery = true)
    List<CategoryRevenueProjection> findRevenueByCategory();

    @Query(value = """
            SELECT
                (date_trunc(CAST(:bucket AS text), COALESCE(p.paid_at, CAST(p.updated_at AS timestamptz)) AT TIME ZONE 'Asia/Ho_Chi_Minh'))::date AS period,
                COALESCE(SUM(p.amount), 0) AS amount
            FROM payments p
            WHERE p.status = 'SUCCESS'
              AND COALESCE(p.paid_at, CAST(p.updated_at AS timestamptz)) >= :fromTs
              AND COALESCE(p.paid_at, CAST(p.updated_at AS timestamptz)) < :toTs
            GROUP BY 1
            ORDER BY 1
            """, nativeQuery = true)
    List<PeriodAmountProjection> findStudentPaymentsByBucket(
            @Param("bucket") String bucket,
            @Param("fromTs") Instant fromTs,
            @Param("toTs") Instant toTs
    );

    @Query(value = """
            SELECT
                (date_trunc(CAST(:bucket AS text), o.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh'))::date AS period,
                COALESCE(SUM(oi.price), 0) AS amount
            FROM order_items oi
            JOIN orders o ON o.order_id = oi.order_id AND o.status = 'PAID'
            JOIN courses c ON c.course_id = oi.course_id AND c.is_deleted = FALSE
            WHERE o.created_at >= :fromTs
              AND o.created_at < :toTs
              AND EXISTS (
                    SELECT 1
                    FROM payments p
                    WHERE p.order_id = o.order_id
                      AND p.status = 'SUCCESS'
              )
            GROUP BY 1
            ORDER BY 1
            """, nativeQuery = true)
    List<PeriodAmountProjection> findCashFlowByBucket(
            @Param("bucket") String bucket,
            @Param("fromTs") Instant fromTs,
            @Param("toTs") Instant toTs
    );

    @Query(
            value = """
                    SELECT
                        o.order_id AS "orderId",
                        p.payment_id AS "paymentId",
                        oi.order_item_id AS "orderItemId",
                        CONCAT('PAY-', p.payment_id) AS "transactionId",
                        u.full_name AS "studentName",
                        c.title AS "courseName",
                        cate.category_id AS "categoryId",
                        cate.name AS "categoryName",
                        CAST(p.payment_method AS text) AS "paymentMethod",
                        CASE
                            WHEN item_totals.item_sum > 0
                                THEN ROUND(p.amount * (oi.price / item_totals.item_sum), 2)
                            ELSE 0
                        END AS amount,
                        CAST('VND' AS text) AS currency,
                        CAST(p.status AS text) AS status,
                        COALESCE(p.paid_at, o.created_at) AS "paidAt"
                    FROM order_items oi
                    JOIN orders o ON o.order_id = oi.order_id
                    JOIN users u ON u.user_id = o.user_id
                    JOIN courses c ON c.course_id = oi.course_id
                    JOIN payments p ON p.payment_id = (
                        SELECT p2.payment_id
                        FROM payments p2
                        WHERE p2.order_id = o.order_id
                        ORDER BY p2.payment_id DESC
                        LIMIT 1
                    )
                    JOIN (
                            SELECT oi2.order_id AS order_id, SUM(oi2.price) AS item_sum
                            FROM order_items oi2
                            GROUP BY oi2.order_id
                    ) item_totals ON item_totals.order_id = o.order_id
                    LEFT JOIN LATERAL (
                        SELECT cat.category_id, cat.name
                        FROM course_categories cc0
                        JOIN categories cat ON cat.category_id = cc0.category_id
                        WHERE cc0.course_id = c.course_id
                          AND cat.is_deleted = FALSE
                        ORDER BY cc0.is_primary DESC, cat.category_id
                        LIMIT 1
                    ) cate ON TRUE
                    WHERE (:search IS NULL OR :search = ''
                        OR LOWER(CONCAT('PAY-', p.payment_id)) LIKE LOWER(CONCAT('%', :search, '%'))
                        OR LOWER(COALESCE(p.transaction_id, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                        OR LOWER(COALESCE(u.full_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                        OR LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%'))
                        OR CAST(p.payment_id AS text) LIKE CONCAT('%', :search, '%')
                        OR CAST(o.order_id AS text) LIKE CONCAT('%', :search, '%'))
                      AND (:categoryId IS NULL OR EXISTS (
                            SELECT 1
                            FROM course_categories cc2
                            WHERE cc2.course_id = c.course_id
                              AND cc2.category_id = :categoryId
                      ))
                      AND (:paymentMethod IS NULL OR :paymentMethod = ''
                        OR CAST(p.payment_method AS text) = :paymentMethod)
                      AND (:status IS NULL OR :status = ''
                        OR CAST(p.status AS text) = :status)
                    ORDER BY COALESCE(p.paid_at, o.created_at) DESC, oi.order_item_id DESC
                    """,
            countQuery = """
                    SELECT COUNT(*)
                    FROM order_items oi
                    JOIN orders o ON o.order_id = oi.order_id
                    JOIN users u ON u.user_id = o.user_id
                    JOIN courses c ON c.course_id = oi.course_id
                    JOIN payments p ON p.payment_id = (
                        SELECT p2.payment_id
                        FROM payments p2
                        WHERE p2.order_id = o.order_id
                        ORDER BY p2.payment_id DESC
                        LIMIT 1
                    )
                    WHERE (:search IS NULL OR :search = ''
                        OR LOWER(CONCAT('PAY-', p.payment_id)) LIKE LOWER(CONCAT('%', :search, '%'))
                        OR LOWER(COALESCE(p.transaction_id, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                        OR LOWER(COALESCE(u.full_name, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                        OR LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%'))
                        OR CAST(p.payment_id AS text) LIKE CONCAT('%', :search, '%')
                        OR CAST(o.order_id AS text) LIKE CONCAT('%', :search, '%'))
                      AND (:categoryId IS NULL OR EXISTS (
                            SELECT 1
                            FROM course_categories cc2
                            WHERE cc2.course_id = c.course_id
                              AND cc2.category_id = :categoryId
                      ))
                      AND (:paymentMethod IS NULL OR :paymentMethod = ''
                        OR CAST(p.payment_method AS text) = :paymentMethod)
                      AND (:status IS NULL OR :status = ''
                        OR CAST(p.status AS text) = :status)
                    """,
            nativeQuery = true
    )
    Page<TransactionLogProjection> findTransactionLog(
            @Param("search") String search,
            @Param("categoryId") Long categoryId,
            @Param("paymentMethod") String paymentMethod,
            @Param("status") String status,
            Pageable pageable
    );

    @Query(value = """
            SELECT
                day_bucket::date AS day,
                amount
            FROM (
                SELECT
                    date_trunc('day', COALESCE(p.paid_at, CAST(p.updated_at AS timestamptz))) AS day_bucket,
                    COALESCE(SUM(p.amount), 0) AS amount
                FROM payments p
                WHERE p.status = 'SUCCESS'
                GROUP BY 1
            ) ranked
            ORDER BY amount DESC
            LIMIT 1
            """, nativeQuery = true)
    PeakDayProjection findPeakRevenueDay();

    @Query(value = """
            SELECT
                month_bucket::date AS "monthStart",
                amount
            FROM (
                SELECT
                    date_trunc('month', COALESCE(p.paid_at, CAST(p.updated_at AS timestamptz))) AS month_bucket,
                    COALESCE(SUM(p.amount), 0) AS amount
                FROM payments p
                WHERE p.status = 'SUCCESS'
                GROUP BY 1
            ) ranked
            ORDER BY amount DESC
            LIMIT 1
            """, nativeQuery = true)
    PeakMonthProjection findPeakRevenueMonth();
}
