package com.example.back_end.repository.admin;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.example.back_end.entity.Voucher;

@Repository
public interface AdminVoucherRepository extends JpaRepository<Voucher, Long> {
    Optional<Voucher> findByCode(String code);

    @Query(value = "select "
            + "u.full_name as \"studentName\", "
            + "c.title as \"registeredCourse\", "
            + "v.code as \"appliedCode\", "
            + "oi.original_price as \"originalPrice\", "
            + "o.discount_amount as \"discount\", "
            + "oi.price as \"paid\", "
            + "o.created_at as \"usedAt\" "
            + "from orders o "
            + "join users u on o.user_id = u.user_id "
            + "join vouchers v on o.voucher_id = v.voucher_id "
            + "join order_items oi on oi.order_id = o.order_id "
            + "join courses c on c.course_id = oi.course_id "
            + "where o.status = 'PAID' "
            + "and o.voucher_id is not null "
            + "order by o.created_at desc",
            nativeQuery = true)
    List<VoucherUsageHistoryProjection> findVoucherUsageHistoryProjections();

    @Query(value = "select "
            + "to_char(date_trunc('month', o.created_at), 'YYYY-MM') as \"month\", "
            + "count(distinct o.order_id) as \"activations\" "
            + "from orders o "
            + "where o.status = 'PAID' "
            + "and o.voucher_id is not null "
            + "group by date_trunc('month', o.created_at) "
            + "order by date_trunc('month', o.created_at)",
            nativeQuery = true)
    List<VoucherUsageFrequencyProjection> findVoucherUsageFrequencyProjections();

    interface VoucherUsageHistoryProjection {
        String getStudentName();

        String getRegisteredCourse();

        String getAppliedCode();

        BigDecimal getOriginalPrice();

        BigDecimal getDiscount();

        BigDecimal getPaid();

        java.time.Instant getUsedAt();
    }

    interface VoucherUsageFrequencyProjection {
        String getMonth();

        Long getActivations();
    }

    @Query(value = "select "
            + "v.code as \"code\", "
            + "count(distinct o.order_id) as \"usedCount\", "
            + "coalesce(sum(o.discount_amount), 0) as \"revenue\" "
            + "from orders o "
            + "join vouchers v on o.voucher_id = v.voucher_id "
            + "where o.status = 'PAID' "
            + "and o.voucher_id is not null "
            + "group by v.code "
            + "order by count(distinct o.order_id) desc",
            nativeQuery = true)
    List<VoucherCampaignStatsProjection> findVoucherCampaignStats();

    interface VoucherCampaignStatsProjection {
        String getCode();

        Long getUsedCount();

        BigDecimal getRevenue();
    }
}
