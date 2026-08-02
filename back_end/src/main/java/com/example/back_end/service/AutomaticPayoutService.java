package com.example.back_end.service;

import com.example.back_end.entity.OrderItem;
import com.example.back_end.entity.Payment;
import com.example.back_end.entity.PayoutRequest;
import com.example.back_end.entity.User;
import com.example.back_end.entity.enums.PayoutRequestStatus;
import com.example.back_end.repository.PayoutRequestRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AutomaticPayoutService {

    private static final String AUTO_ORDER_MARKER = "AUTO_ORDER_";

    private final RevenueShareCalculator revenueShareCalculator;
    private final PayoutRequestRepository payoutRequestRepository;
    private final ApplicationEventPublisher eventPublisher;

    /** Runs inside the payment transaction. The caller already holds the order write lock. */
    public void createForSuccessfulPayment(Payment payment, List<OrderItem> orderItems) {
        BigDecimal actualPaid = payment.getAmount();
        if (actualPaid == null || actualPaid.signum() <= 0 || orderItems.isEmpty()) {
            return;
        }

        String marker = AUTO_ORDER_MARKER + payment.getOrder().getId() + ";";
        Map<User, BigDecimal> amountByTeacher = new LinkedHashMap<>();
        Map<User, List<Long>> coursesByTeacher = new LinkedHashMap<>();
        List<BigDecimal> allocatedItemAmounts = allocateActualPaidAmount(actualPaid, orderItems);

        for (int i = 0; i < orderItems.size(); i++) {
            OrderItem item = orderItems.get(i);
            User teacher = item.getCourse().getInstructor();
            BigDecimal teacherAmount = revenueShareCalculator
                    .calculate(allocatedItemAmounts.get(i))
                    .instructorAmount();
            amountByTeacher.merge(teacher, teacherAmount, BigDecimal::add);
            coursesByTeacher.computeIfAbsent(teacher, ignored -> new ArrayList<>()).add(item.getCourse().getId());
        }

        for (Map.Entry<User, BigDecimal> entry : amountByTeacher.entrySet()) {
            User teacher = entry.getKey();
            if (entry.getValue().signum() <= 0
                    || payoutRequestRepository.existsByTeacher_IdAndNotesContaining(teacher.getId(), marker)) {
                continue;
            }
            PayoutRequest payout = new PayoutRequest();
            payout.setTeacher(teacher);
            payout.setAmount(entry.getValue().setScale(2, RoundingMode.UNNECESSARY));
            payout.setStatus(PayoutRequestStatus.PENDING);
            payout.setNotes(marker + " payment=" + payment.getId() + "; courses=" + coursesByTeacher.get(teacher));
            payout.setCreatedAt(Instant.now());
            payoutRequestRepository.saveAndFlush(payout);
            eventPublisher.publishEvent(new AutomaticPayoutCreated(payout.getId()));
        }
    }

    private List<BigDecimal> allocateActualPaidAmount(BigDecimal actualPaid, List<OrderItem> items) {
        BigDecimal paidVnd = actualPaid.setScale(0, RoundingMode.DOWN);
        BigDecimal itemTotal = items.stream()
                .map(OrderItem::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (itemTotal.signum() <= 0) {
            throw new IllegalStateException("Paid order has no positive item amount");
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

    public record AutomaticPayoutCreated(Long payoutRequestId) {}
}
