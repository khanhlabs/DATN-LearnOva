package com.example.back_end.instructor.application;

import com.example.back_end.auth.domain.User;
import com.example.back_end.auth.infrastructure.persistence.UserRepository;
import com.example.back_end.commerce.application.RevenueShareCalculator;
import com.example.back_end.commerce.infrastructure.persistence.OrderRepository;
import com.example.back_end.instructor.adapter.in.web.dto.TeacherEarningsResponse;
import com.example.back_end.shared.exception.ResourceNotFoundException;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TeacherEarningsService {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final RevenueShareCalculator revenueShareCalculator;

    public TeacherEarningsResponse getEarnings(String email) {
        User instructor = userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("Instructor not found"));

        List<TeacherEarningsResponse.EarningItem> items = orderRepository
                .findEarningsByInstructor(instructor.getId())
                .stream()
                .map(this::toEarningItem)
                .sorted(Comparator.comparing(
                        TeacherEarningsResponse.EarningItem::paidAt,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ))
                .toList();

        return new TeacherEarningsResponse(items);
    }

    public TeacherEarningsResponse.EarningItem getEarningDetail(String email, Long orderItemId) {
        User instructor = userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("Instructor not found"));

        OrderRepository.InstructorEarningProjection row = orderRepository
                .findEarningByInstructorAndOrderItem(instructor.getId(), orderItemId);
        if (row == null) {
            throw new ResourceNotFoundException("Earning transaction not found");
        }
        return toEarningItem(row);
    }

    private TeacherEarningsResponse.EarningItem toEarningItem(
            OrderRepository.InstructorEarningProjection row
    ) {
        BigDecimal paidAmount = nullToZero(row.getPaidAmount());
        RevenueShareCalculator.RevenueShare share = revenueShareCalculator.calculate(paidAmount);
        return new TeacherEarningsResponse.EarningItem(
                row.getOrderItemId(),
                row.getOrderId(),
                row.getPaymentId(),
                row.getTransactionId(),
                row.getStudentName(),
                row.getCourseTitle(),
                paidAmount,
                share.adminAmount(),
                share.instructorAmount(),
                row.getPaidAt(),
                row.getPaymentStatus()
        );
    }

    private static BigDecimal nullToZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
