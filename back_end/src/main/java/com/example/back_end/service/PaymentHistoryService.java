package com.example.back_end.service;

import com.example.back_end.dto.response.PaymentHistoryDetailResponse;
import com.example.back_end.dto.response.PaymentHistoryItemResponse;
import com.example.back_end.dto.response.PaymentHistoryResponse;
import com.example.back_end.entity.Order;
import com.example.back_end.entity.OrderItem;
import com.example.back_end.entity.Payment;
import com.example.back_end.entity.User;
import com.example.back_end.entity.enums.OrderStatus;
import com.example.back_end.entity.enums.PaymentStatus;
import com.example.back_end.repository.OrderItemRepository;
import com.example.back_end.repository.OrderRepository;
import com.example.back_end.repository.PaymentRepository;
import com.example.back_end.repository.UserRepository;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.awt.Color;

@Service
@RequiredArgsConstructor
public class PaymentHistoryService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<PaymentHistoryResponse> getHistory(
            String status,
            String from,
            String to,
            String search,
            Pageable pageable
    ) {
        User user = getCurrentUser();
        String normalizedStatus = normalizeStatus(status);
        Instant fromDate = parseDate(from, false);
        Instant toDate = parseDate(to, true);
        String normalizedSearch = hasText(search) ? search.trim() : null;

        return orderRepository.findPaymentHistory(
                        user.getId(),
                        normalizedStatus,
                        fromDate,
                        toDate,
                        normalizedSearch,
                        pageable
                )
                .map(this::toHistoryResponse);
    }

    @Transactional(readOnly = true)
    public PaymentHistoryDetailResponse getDetail(Long orderId) {
        User user = getCurrentUser();
        Order order = getOwnedOrder(orderId, user.getId());
        return toDetailResponse(order);
    }

    @Transactional(readOnly = true)
    public byte[] generateReceipt(Long orderId) {
        User user = getCurrentUser();
        Order order = getOwnedOrder(orderId, user.getId());
        Payment payment = getLatestPayment(orderId);

        if (order.getStatus() != OrderStatus.PAID || payment.getStatus() != PaymentStatus.SUCCESS) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A payment receipt is available only for successful payments."
            );
        }

        PaymentHistoryDetailResponse detail = toDetailResponse(order);
        try {
            return buildPdf(detail);
        } catch (DocumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Could not generate payment receipt.",
                    exception
            );
        }
    }

    private PaymentHistoryResponse toHistoryResponse(Order order) {
        Payment payment = getLatestPayment(order.getId());
        List<String> courseTitles = orderItemRepository.findByOrderIdWithCourse(order.getId())
                .stream()
                .map(item -> item.getCourse().getTitle())
                .toList();

        return new PaymentHistoryResponse(
                order.getId(),
                order.getCreatedAt(),
                payment.getPaidAt(),
                courseTitles,
                order.getTotalAmount(),
                payment.getAmount(),
                payment.getCurrency(),
                payment.getPaymentMethod() == null ? null : payment.getPaymentMethod().name(),
                order.getStatus() == null ? null : order.getStatus().name(),
                payment.getStatus() == null ? null : payment.getStatus().name(),
                payment.getTransactionId()
        );
    }

    private PaymentHistoryDetailResponse toDetailResponse(Order order) {
        Payment payment = getLatestPayment(order.getId());
        List<PaymentHistoryItemResponse> items = orderItemRepository.findByOrderIdWithCourse(order.getId())
                .stream()
                .map(this::toItemResponse)
                .toList();

        return new PaymentHistoryDetailResponse(
                order.getId(),
                order.getCreatedAt(),
                payment.getPaidAt(),
                order.getUser().getFullName(),
                order.getUser().getEmail(),
                order.getUser().getPhone(),
                items,
                order.getVoucher() == null ? null : order.getVoucher().getCode(),
                order.getSubtotal(),
                order.getDiscountAmount(),
                order.getTotalAmount(),
                payment.getAmount(),
                payment.getCurrency(),
                payment.getPaymentMethod() == null ? null : payment.getPaymentMethod().name(),
                order.getStatus() == null ? null : order.getStatus().name(),
                payment.getStatus() == null ? null : payment.getStatus().name(),
                payment.getTransactionId()
        );
    }

    private PaymentHistoryItemResponse toItemResponse(OrderItem item) {
        return new PaymentHistoryItemResponse(
                item.getCourse().getId(),
                item.getCourse().getTitle(),
                item.getOriginalPrice(),
                item.getPrice()
        );
    }

    private Payment getLatestPayment(Long orderId) {
        return paymentRepository.findFirstByOrderIdOrderByIdDesc(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
    }

    private Order getOwnedOrder(Long orderId, Long userId) {
        return orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return userRepository.findByEmailAndIsDeletedFalse(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private String normalizeStatus(String status) {
        if (!hasText(status)) {
            return null;
        }
        String normalized = status.trim().toUpperCase(Locale.ROOT);
        try {
            OrderStatus.valueOf(normalized);
            return normalized;
        } catch (IllegalArgumentException ignored) {
            try {
                PaymentStatus.valueOf(normalized);
                return normalized;
            } catch (IllegalArgumentException invalidStatus) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid payment status");
            }
        }
    }

    private Instant parseDate(String value, boolean endExclusive) {
        if (!hasText(value)) {
            return null;
        }
        try {
            LocalDate date = LocalDate.parse(value.trim());
            Instant instant = date.atStartOfDay(ZoneOffset.UTC).toInstant();
            return endExclusive ? instant.plus(1, ChronoUnit.DAYS) : instant;
        } catch (DateTimeParseException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Date must use yyyy-MM-dd format");
        }
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private byte[] buildPdf(PaymentHistoryDetailResponse detail) throws DocumentException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 42, 42, 42, 42);
        PdfWriter.getInstance(document, output);
        document.open();

        Font title = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, Color.DARK_GRAY);
        Font heading = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, Color.DARK_GRAY);
        Font body = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.DARK_GRAY);
        Font small = FontFactory.getFont(FontFactory.HELVETICA, 9, Color.GRAY);

        document.add(new Paragraph("LearnOva", heading));
        document.add(new Paragraph("Payment Receipt", title));
        document.add(new Paragraph("Order #" + detail.orderId(), body));
        document.add(new Paragraph("Order date: " + detail.createdAt(), small));
        document.add(new Paragraph("Paid date: " + (detail.paidAt() == null ? "-" : detail.paidAt()), small));
        document.add(new Paragraph(" "));

        document.add(new Paragraph("Customer", heading));
        document.add(new Paragraph(nullSafe(detail.fullName()) + " | " + nullSafe(detail.email()), body));
        document.add(new Paragraph("Phone: " + nullSafe(detail.phone()), small));
        document.add(new Paragraph(" "));

        PdfPTable itemsTable = new PdfPTable(new float[]{7f});
        itemsTable.setWidthPercentage(100);
        itemsTable.addCell(new Phrase("Course", heading));
        for (PaymentHistoryItemResponse item : detail.items()) {
            itemsTable.addCell(new Phrase(item.courseTitle(), body));
        }
        document.add(itemsTable);
        document.add(new Paragraph(" "));
        document.add(new Paragraph("Total paid (VND): " + formatVnd(detail.amountVnd(), "VND"), heading));
        document.add(new Paragraph("Payment method: " + nullSafe(detail.paymentMethod()), body));
        document.add(new Paragraph("Transaction ID: " + nullSafe(detail.transactionId()), small));
        document.add(new Paragraph("Status: " + nullSafe(detail.paymentStatus()), small));
        document.add(new Paragraph(" "));
        document.add(new Paragraph("This is an electronic payment receipt for LearnOva courses.", small));
        document.close();
        return output.toByteArray();
    }

    private String formatVnd(java.math.BigDecimal value, String currency) {
        return value == null ? "-" : value.toBigInteger().toString() + " " + nullSafe(currency);
    }

    private String nullSafe(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }
}
