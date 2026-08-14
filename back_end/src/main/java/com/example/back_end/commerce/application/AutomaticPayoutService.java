package com.example.back_end.commerce.application;

import com.example.back_end.auth.domain.User;
import com.example.back_end.commerce.domain.OrderItem;
import com.example.back_end.commerce.domain.Payment;
import com.example.back_end.commerce.domain.PayoutRequest;
import com.example.back_end.commerce.domain.enums.PayoutRequestStatus;
import com.example.back_end.commerce.infrastructure.persistence.PayoutRequestRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AutomaticPayoutService {

    private static final String AUTO_ORDER_MARKER = "AUTO_ORDER_";

    private final RevenueShareCalculator revenueShareCalculator;
    private final PayoutRequestRepository payoutRequestRepository;

    /** Runs inside the payment transaction. Caller already holds the order write lock. */
    public int createForSuccessfulPayment(Payment payment, List<OrderItem> orderItems) {
        BigDecimal actualPaid = payment.getAmount();
        if (actualPaid == null || actualPaid.signum() <= 0 || orderItems == null || orderItems.isEmpty()) {
            return 0;
        }
        if (payment.getOrder() == null || payment.getOrder().getId() == null) {
            return 0;
        }

        String marker = AUTO_ORDER_MARKER + payment.getOrder().getId() + ";";
        Map<User, BigDecimal> amountByTeacher = new LinkedHashMap<>();
        Map<User, List<Long>> coursesByTeacher = new LinkedHashMap<>();
        List<BigDecimal> allocatedItemAmounts = allocateActualPaidAmount(actualPaid, orderItems);
        if (allocatedItemAmounts.size() != orderItems.size()) {
            return 0;
        }

        for (int i = 0; i < orderItems.size(); i++) {
            OrderItem item = orderItems.get(i);
            User teacher = item.getCourse().getInstructor();
            if (teacher == null) {
                continue;
            }
            BigDecimal teacherAmount = revenueShareCalculator
                    .calculate(allocatedItemAmounts.get(i))
                    .instructorAmount();
            amountByTeacher.merge(teacher, teacherAmount, BigDecimal::add);
            coursesByTeacher.computeIfAbsent(teacher, ignored -> new ArrayList<>()).add(item.getCourse().getId());
        }

        int created = 0;
        for (Map.Entry<User, BigDecimal> entry : amountByTeacher.entrySet()) {
            User teacher = entry.getKey();
            if (entry.getValue().signum() <= 0
                    || payoutRequestRepository.existsByTeacher_IdAndNotesContaining(teacher.getId(), marker)) {
                continue;
            }
            PayoutRequest payout = new PayoutRequest();
            payout.setTeacher(teacher);
            payout.setAmount(entry.getValue().setScale(2, RoundingMode.HALF_UP));
            payout.setStatus(PayoutRequestStatus.PENDING);
            payout.setNotes(marker + " payment=" + payment.getId() + "; courses=" + coursesByTeacher.get(teacher));
            payout.setCreatedAt(Instant.now());
            payoutRequestRepository.saveAndFlush(payout);
            created++;
            log.info(
                    "Saved instructor share {} VND (80%) for teacherId={} orderId={} paymentId={}",
                    payout.getAmount(),
                    teacher.getId(),
                    payment.getOrder().getId(),
                    payment.getId()
            );
        }
        return created;
    }

    private List<BigDecimal> allocateActualPaidAmount(BigDecimal actualPaid, List<OrderItem> items) {
        BigDecimal paidVnd = actualPaid.setScale(0, RoundingMode.DOWN);
        BigDecimal itemTotal = items.stream()
                .map(OrderItem::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (itemTotal.signum() <= 0) {
            log.warn("Skip instructor payout: paid order has no positive item amount");
            return List.of();
        }

        List<BigDecimal> result = new ArrayList<>(items.size());
        BigDecimal allocated = BigDecimal.ZERO;
        for (int i = 0; i < items.size(); i++) {
            BigDecimal amount = i == items.size() - 1
                    ? paidVnd.subtract(allocated)
                    : paidVnd.multiply(items.get(i).getPrice()).divide(itemTotal, 0, RoundingMode.DOWN);
            result.add(amount);
            allocated = allocated.add(amount);
        }
        return result;
    }
}
