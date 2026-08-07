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
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
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
import java.time.OffsetDateTime;
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
        return toDetailResponse(resolveOrderAccess(orderId));
    }

    @Transactional(readOnly = true)
    public byte[] generateReceipt(Long orderId) {
        Order order = resolveOrderAccess(orderId);
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

    /** Users may only access their own orders; admins may access any order. */
    private Order resolveOrderAccess(Long orderId) {
        User user = getCurrentUser();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));

        if (isAdmin) {
            return orderRepository.findById(orderId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        }
        return getOwnedOrder(orderId, user.getId());
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

        Color navy = new Color(15, 23, 42);
        Color blue = new Color(37, 99, 235);
        Color paleBlue = new Color(239, 246, 255);
        Color border = new Color(219, 234, 254);
        Color muted = new Color(100, 116, 139);
        Color success = new Color(22, 101, 52);
        Color paleGreen = new Color(220, 252, 231);

        Font brand = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, blue);
        Font title = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 24, navy);
        Font heading = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, navy);
        Font body = FontFactory.getFont(FontFactory.HELVETICA, 10, navy);
        Font small = FontFactory.getFont(FontFactory.HELVETICA, 9, muted);
        Font totalFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 15, blue);

        PdfPTable header = new PdfPTable(new float[]{5f, 2f});
        header.setWidthPercentage(100);
        header.setSpacingAfter(18f);

        PdfPCell brandCell = new PdfPCell(new Phrase("LearnOva", brand));
        brandCell.setBorder(PdfPCell.NO_BORDER);
        brandCell.setPadding(0);
        header.addCell(brandCell);

        PdfPCell statusCell = new PdfPCell(new Phrase("PAID", FontFactory.getFont(
                FontFactory.HELVETICA_BOLD, 10, success)));
        statusCell.setBackgroundColor(paleGreen);
        statusCell.setBorderColor(paleGreen);
        statusCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        statusCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        statusCell.setPadding(8f);
        header.addCell(statusCell);
        document.add(header);

        Paragraph titleParagraph = new Paragraph("Payment Receipt", title);
        titleParagraph.setSpacingAfter(4f);
        document.add(titleParagraph);

        Paragraph orderParagraph = new Paragraph("Order #" + detail.orderId(), body);
        orderParagraph.setSpacingAfter(14f);
        document.add(orderParagraph);

        PdfPTable metadata = new PdfPTable(new float[]{1f, 1f});
        metadata.setWidthPercentage(100);
        metadata.setSpacingAfter(18f);
        addInfoCell(metadata, "ORDER DATE", formatInstant(detail.createdAt()), small, heading, paleBlue, border);
        addInfoCell(metadata, "PAID DATE", formatInstant(detail.paidAt()), small, heading, paleBlue, border);
        addInfoCell(metadata, "PAYMENT METHOD", nullSafe(detail.paymentMethod()), small, heading, paleBlue, border);
        addInfoCell(metadata, "TRANSACTION ID", nullSafe(detail.transactionId()), small, heading, paleBlue, border);
        document.add(metadata);

        document.add(new Paragraph("Customer", heading));
        document.add(new Paragraph(nullSafe(detail.fullName()) + "  |  " + nullSafe(detail.email()), body));
        document.add(new Paragraph("Phone: " + nullSafe(detail.phone()), small));
        document.add(new Paragraph(" "));

        PdfPTable itemsTable = new PdfPTable(new float[]{6f, 2f});
        itemsTable.setWidthPercentage(100);
        itemsTable.setSpacingBefore(8f);
        itemsTable.setSpacingAfter(16f);
        addHeaderCell(itemsTable, "COURSE", heading, blue);
        addHeaderCell(itemsTable, "PRICE", heading, blue);
        for (PaymentHistoryItemResponse item : detail.items()) {
            addBodyCell(itemsTable, nullSafe(item.courseTitle()), body, false);
            addBodyCell(itemsTable, formatVnd(item.price(), "VND"), body, true);
        }
        document.add(itemsTable);

        PdfPTable summary = new PdfPTable(new float[]{1f, 1f});
        summary.setWidthPercentage(100);
        summary.setSpacingBefore(4f);
        summary.setSpacingAfter(18f);
        addSummaryCell(summary, "Subtotal", formatVnd(detail.subtotal(), "VND"), body, false);
        addSummaryCell(summary, "Discount", formatVnd(detail.discountAmount(), "VND"), body, false);
        addSummaryCell(summary, "TOTAL PAID", formatVnd(detail.amountVnd(), "VND"), totalFont, true);
        document.add(summary);

        Paragraph footer = new Paragraph(
                "Thank you for learning with LearnOva. This is an electronic payment receipt.",
                small
        );
        footer.setAlignment(Element.ALIGN_CENTER);
        document.add(footer);
        document.close();
        return output.toByteArray();
    }

    private void addInfoCell(
            PdfPTable table,
            String label,
            String value,
            Font valueFont,
            Font labelFont,
            Color background,
            Color border
    ) {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(background);
        cell.setBorderColor(border);
        cell.setPadding(10f);
        cell.addElement(new Paragraph(label, labelFont));
        cell.addElement(new Paragraph(value, valueFont));
        table.addCell(cell);
    }

    private void addHeaderCell(PdfPTable table, String value, Font font, Color background) {
        PdfPCell cell = new PdfPCell(new Phrase(value, font));
        cell.setBackgroundColor(background);
        cell.setBorderColor(background);
        cell.setPadding(9f);
        cell.setHorizontalAlignment(Element.ALIGN_LEFT);
        table.addCell(cell);
    }

    private void addBodyCell(PdfPTable table, String value, Font font, boolean rightAligned) {
        PdfPCell cell = new PdfPCell(new Phrase(value, font));
        cell.setBorderColor(new Color(226, 232, 240));
        cell.setPadding(9f);
        cell.setHorizontalAlignment(rightAligned ? Element.ALIGN_RIGHT : Element.ALIGN_LEFT);
        table.addCell(cell);
    }

    private void addSummaryCell(PdfPTable table, String label, String value, Font font, boolean highlighted) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, font));
        PdfPCell valueCell = new PdfPCell(new Phrase(value, font));
        labelCell.setPadding(8f);
        valueCell.setPadding(8f);
        labelCell.setBorderColor(new Color(226, 232, 240));
        valueCell.setBorderColor(new Color(226, 232, 240));
        valueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        if (highlighted) {
            labelCell.setBackgroundColor(new Color(239, 246, 255));
            valueCell.setBackgroundColor(new Color(239, 246, 255));
        }
        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    private String formatInstant(Instant value) {
        return value == null ? "-" : value.toString();
    }

    private String formatInstant(OffsetDateTime value) {
        return value == null ? "-" : value.toString();
    }

    private String formatVnd(java.math.BigDecimal value, String currency) {
        return value == null ? "-" : value.toBigInteger().toString() + " " + nullSafe(currency);
    }

    private String nullSafe(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }
}
