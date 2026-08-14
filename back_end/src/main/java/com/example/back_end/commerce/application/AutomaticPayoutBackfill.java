package com.example.back_end.commerce.application;

import com.example.back_end.commerce.domain.OrderItem;
import com.example.back_end.commerce.domain.Payment;
import com.example.back_end.commerce.domain.enums.PaymentStatus;
import com.example.back_end.commerce.infrastructure.persistence.OrderItemRepository;
import com.example.back_end.commerce.infrastructure.persistence.PaymentRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class AutomaticPayoutBackfill implements ApplicationRunner {

    private final AutomaticPayoutService automaticPayoutService;
    private final PaymentRepository paymentRepository;
    private final OrderItemRepository orderItemRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        try {
            List<Payment> payments = paymentRepository.findByStatusWithOrder(PaymentStatus.SUCCESS);
            int created = 0;
            for (Payment payment : payments) {
                try {
                    List<OrderItem> items = orderItemRepository.findByOrderIdWithCourse(payment.getOrder().getId());
                    created += automaticPayoutService.createForSuccessfulPayment(payment, items);
                } catch (RuntimeException ex) {
                    log.warn(
                            "Skip payout backfill for paymentId={}: {}",
                            payment.getId(),
                            ex.getMessage()
                    );
                }
            }
            if (created > 0) {
                log.info("Backfilled {} instructor payout_requests from existing paid orders", created);
            }
        } catch (RuntimeException ex) {
            log.warn("Instructor payout backfill did not run: {}", ex.getMessage());
        }
    }
}
