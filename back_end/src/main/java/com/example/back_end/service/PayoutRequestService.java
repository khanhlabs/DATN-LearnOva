package com.example.back_end.service;

import com.example.back_end.dto.request.CreatePayoutRequestRequest;
import com.example.back_end.dto.response.PayoutBalanceResponse;
import com.example.back_end.dto.response.PayoutRequestResponse;
import com.example.back_end.entity.PayoutRequest;
import com.example.back_end.entity.User;
import com.example.back_end.entity.enums.NotificationType;
import com.example.back_end.entity.enums.PayoutRequestStatus;
import com.example.back_end.exception.BusinessException;
import com.example.back_end.exception.ResourceNotFoundException;
import com.example.back_end.repository.OrderRepository;
import com.example.back_end.repository.PayoutRequestRepository;
import com.example.back_end.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class PayoutRequestService {

    private final PayoutRequestRepository payoutRequestRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public PayoutBalanceResponse getBalance(String email) {
        User teacher = findTeacher(email);
        return computeBalance(teacher.getId());
    }

    public PayoutRequestResponse submit(String email, CreatePayoutRequestRequest request) {
        User teacher = findTeacher(email);

        PayoutBalanceResponse balance = computeBalance(teacher.getId());
        if (request.amount().compareTo(balance.availableBalance()) > 0) {
            throw new BusinessException("Requested amount exceeds your available balance.");
        }

        PayoutRequest payoutRequest = new PayoutRequest();
        payoutRequest.setTeacher(teacher);
        payoutRequest.setAmount(request.amount());
        payoutRequest.setStatus(PayoutRequestStatus.PENDING);
        payoutRequest.setNotes(request.notes());
        payoutRequest.setCreatedAt(Instant.now());
        payoutRequestRepository.save(payoutRequest);

        List<User> admins = userRepository.findAllAdmins();
        notificationService.createForAll(
                admins,
                NotificationType.PAYOUT_REQUESTED,
                "New payout request",
                (teacher.getFullName() != null ? teacher.getFullName() : teacher.getEmail())
                        + " requested a payout of " + request.amount() + ".",
                "/learnova/admin/payout-requests",
                Map.of("payoutRequestId", payoutRequest.getId(), "teacherId", teacher.getId())
        );

        return toResponse(payoutRequest);
    }

    @Transactional(readOnly = true)
    public List<PayoutRequestResponse> getMyHistory(String email) {
        User teacher = findTeacher(email);
        return payoutRequestRepository.findByTeacher_IdOrderByCreatedAtDesc(teacher.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PayoutRequestResponse> listAll() {
        return payoutRequestRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PayoutRequestResponse getById(Long id) {
        return toResponse(findById(id));
    }

    public PayoutRequestResponse markPaid(Long id) {
        PayoutRequest payoutRequest = findById(id);

        if (payoutRequest.getStatus() != PayoutRequestStatus.PENDING) {
            throw new BusinessException("Only PENDING payout requests can be marked as paid.");
        }

        payoutRequest.setStatus(PayoutRequestStatus.PAID);
        payoutRequest.setProcessedAt(Instant.now());
        payoutRequestRepository.save(payoutRequest);

        notificationService.create(
                payoutRequest.getTeacher(),
                NotificationType.PAYOUT_PAID,
                "Payout completed",
                "Your payout request of " + payoutRequest.getAmount() + " has been paid.",
                "/learnova/teacher/revenue",
                Map.of("payoutRequestId", payoutRequest.getId())
        );

        return toResponse(payoutRequest);
    }

    public PayoutRequestResponse reject(Long id, String reason) {
        PayoutRequest payoutRequest = findById(id);

        if (payoutRequest.getStatus() != PayoutRequestStatus.PENDING) {
            throw new BusinessException("Only PENDING payout requests can be rejected.");
        }

        payoutRequest.setStatus(PayoutRequestStatus.REJECTED);
        payoutRequest.setRejectionReason(reason);
        payoutRequest.setProcessedAt(Instant.now());
        payoutRequestRepository.save(payoutRequest);

        notificationService.create(
                payoutRequest.getTeacher(),
                NotificationType.PAYOUT_REJECTED,
                "Payout request rejected",
                "Your payout request of " + payoutRequest.getAmount() + " was rejected. Reason: " + reason,
                "/learnova/teacher/revenue",
                Map.of("payoutRequestId", payoutRequest.getId())
        );

        return toResponse(payoutRequest);
    }

    private PayoutBalanceResponse computeBalance(Long teacherId) {
        BigDecimal lifetimeRevenue = orderRepository.findTotalRevenueByInstructor(teacherId);
        BigDecimal lifetimeRefunds = orderRepository.findLifetimeRefundsByInstructor(teacherId);
        BigDecimal pendingOrPaidPayouts = payoutRequestRepository.sumOpenAndPaidByTeacher(teacherId);

        BigDecimal availableBalance = lifetimeRevenue
                .subtract(lifetimeRefunds)
                .subtract(pendingOrPaidPayouts);
        if (availableBalance.compareTo(BigDecimal.ZERO) < 0) {
            availableBalance = BigDecimal.ZERO;
        }

        return new PayoutBalanceResponse(lifetimeRevenue, lifetimeRefunds, pendingOrPaidPayouts, availableBalance);
    }

    private PayoutRequest findById(Long id) {
        return payoutRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payout request not found id=" + id));
    }

    private User findTeacher(String email) {
        return userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private PayoutRequestResponse toResponse(PayoutRequest p) {
        return new PayoutRequestResponse(
                p.getId(),
                p.getTeacher().getId(),
                p.getTeacher().getFullName(),
                p.getTeacher().getEmail(),
                p.getAmount(),
                p.getStatus().name(),
                p.getNotes(),
                p.getRejectionReason(),
                p.getCreatedAt(),
                p.getProcessedAt()
        );
    }
}
