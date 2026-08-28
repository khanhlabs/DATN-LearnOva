package com.example.back_end.instructor.adapter.in.web.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record TeacherEarningsResponse(List<EarningItem> items) {

    public record EarningItem(
            Long orderItemId,
            Long orderId,
            Long paymentId,
            String transactionId,
            String studentName,
            String courseTitle,
            BigDecimal paidAmount,
            BigDecimal platformFee,
            BigDecimal instructorIncome,
            Instant paidAt,
            String paymentStatus
    ) {}
}