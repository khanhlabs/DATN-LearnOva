package com.example.back_end.service;

import com.example.back_end.dto.request.CreatePaymentRequest;
import com.example.back_end.dto.response.CreatePaymentResponse;
import com.example.back_end.dto.response.PaymentStatusResponse;
import com.example.back_end.entity.Course;
import com.example.back_end.entity.Enrollment;
import com.example.back_end.entity.EnrollmentId;
import com.example.back_end.entity.Order;
import com.example.back_end.entity.OrderItem;
import com.example.back_end.entity.Payment;
import com.example.back_end.entity.User;
import com.example.back_end.entity.Voucher;
import com.example.back_end.entity.enums.CourseStatus;
import com.example.back_end.entity.enums.DiscountType;
import com.example.back_end.entity.enums.NotificationType;
import com.example.back_end.entity.enums.OrderStatus;
import com.example.back_end.entity.enums.PaymentMethod;
import com.example.back_end.entity.enums.PaymentStatus;
import com.example.back_end.repository.CourseRepository;
import com.example.back_end.repository.EnrollmentRepository;
import com.example.back_end.repository.OrderRepository;
import com.example.back_end.repository.OrderItemRepository;
import com.example.back_end.repository.PaymentRepository;
import com.example.back_end.repository.UserRepository;
import com.example.back_end.repository.VoucherRepository;
import com.example.back_end.security.CustomUserDetails;
import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {
    // Student checkout: USD catalog → VND PayOS → webhook/poll unlocks courses.

    private static final String RESPONSE_PAYMENT_METHOD = "PAYOS";
    private static final long MIN_PAYOS_AMOUNT_VND = 1000L;
    /** PayOS merchant API hard limit. */
    private static final long MAX_PAYOS_AMOUNT_VND = 10_000_000_000L;
    /** Unique payOS orderCode generator (DB order id is reused after resets / retries). */
    private static final AtomicLong PAYOS_ORDER_CODE_SEQ = new AtomicLong(System.currentTimeMillis());

    private final CourseRepository courseRepository;
    private final VoucherRepository voucherRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final PaymentRepository paymentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final PayOSService payOSService;
    private final ExchangeRateService exchangeRateService;
    private final NotificationService notificationService;

    @Transactional
    public CreatePaymentResponse createPayment(CreatePaymentRequest request) {
        User currentUser = getCurrentUser();
        List<Course> courses = resolveCheckoutCourses(request);
        validateCheckoutCourses(courses, currentUser);

        BigDecimal catalogSubtotal = courses.stream()
                .map(course -> course.getBasePrice() == null ? BigDecimal.ZERO : course.getBasePrice())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        Voucher voucher = null;
        BigDecimal catalogDiscount = BigDecimal.ZERO;
        if (StringUtils.hasText(request.voucherCode())) {
            voucher = validateVoucher(request.voucherCode(), catalogSubtotal);
            catalogDiscount = calculateDiscount(voucher, catalogSubtotal);
        }

        BigDecimal catalogTotal = catalogSubtotal.subtract(catalogDiscount).max(BigDecimal.ZERO);
        Instant now = Instant.now();

        Order order = new Order();
        order.setUser(currentUser);
        order.setVoucher(voucher);
        order.setSubtotal(catalogSubtotal);
        order.setDiscountAmount(catalogDiscount);
        order.setTotalAmount(catalogTotal);
        order.setStatus(OrderStatus.PENDING);
        order.setCreatedAt(now);
        order.setUpdatedAt(now);
        orderRepository.saveAndFlush(order);

        BigDecimal remainingDiscount = catalogDiscount;
        boolean zeroSubtotal = catalogSubtotal.compareTo(BigDecimal.ZERO) <= 0;
        for (int index = 0; index < courses.size(); index++) {
            Course course = courses.get(index);
            BigDecimal itemDiscount;
            if (zeroSubtotal) {
                itemDiscount = BigDecimal.ZERO;
            } else if (index == courses.size() - 1) {
                itemDiscount = remainingDiscount;
            } else {
                BigDecimal base = course.getBasePrice() == null ? BigDecimal.ZERO : course.getBasePrice();
                itemDiscount = catalogDiscount.multiply(base)
                        .divide(catalogSubtotal, 2, RoundingMode.HALF_UP);
                remainingDiscount = remainingDiscount.subtract(itemDiscount);
            }

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setCourse(course);
            BigDecimal originalPrice = course.getBasePrice() == null ? BigDecimal.ZERO : course.getBasePrice();
            orderItem.setOriginalPrice(originalPrice);
            orderItem.setPrice(originalPrice.subtract(itemDiscount).max(BigDecimal.ZERO));
            orderItemRepository.save(orderItem);
        }

        // Free course OR voucher brings total to $0 → enroll immediately (no PayOS QR).
        if (catalogTotal.compareTo(BigDecimal.ZERO) == 0) {
            Payment payment = new Payment();
            payment.setOrder(order);
            payment.setAmount(BigDecimal.ZERO);
            payment.setCurrency("USD");
            payment.setPaymentMethod(resolveStoredPaymentMethod());
            payment.setStatus(PaymentStatus.PENDING);
            payment.setPaidAt(null);
            payment.setUpdatedAt(now);
            paymentRepository.save(payment);

            markOrderPaid(order, payment);

            Course primaryCourse = courses.getFirst();
            List<String> courseTitles = courses.stream()
                    .map(Course::getTitle)
                    .collect(java.util.stream.Collectors.toList());
            String courseTitle = String.join(" · ", courseTitles);

            // Java has no named args — positional only. "FREE" = FE skips PayOS QR.
            return new CreatePaymentResponse(
                    order.getId(),
                    payment.getId(),
                    primaryCourse.getId(),
                    courseTitle,
                    courseTitles,
                    catalogSubtotal,
                    catalogDiscount,
                    catalogTotal,
                    BigDecimal.ZERO,
                    0L,
                    BigDecimal.ZERO,
                    "FREE",
                    payment.getStatus().name(),
                    order.getStatus().name(),
                    null,
                    null,
                    null,
                    null
            );
        }

        BigDecimal exchangeRate = exchangeRateService.getUsdToVnd();
        PayOsAmount payOsAmount = toPayOsAmount(catalogTotal, exchangeRate);
        long amountVnd = payOsAmount.amountVnd();

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setAmount(BigDecimal.valueOf(amountVnd));
        payment.setCurrency("VND");
        payment.setPaymentMethod(resolveStoredPaymentMethod());
        payment.setStatus(PaymentStatus.PENDING);
        payment.setPaidAt(null);
        payment.setUpdatedAt(now);
        paymentRepository.save(payment);

        PayOSService.PayOSCreatePaymentResult payOSPayment;
        try {
            long payOsOrderCode = nextPayOsOrderCode(order.getId());
            payOSPayment = payOSService.createPaymentLink(order, courses, amountVnd, payOsOrderCode);
        } catch (IllegalStateException ex) {
            String detail = ex.getMessage() == null ? "payOS create payment failed" : ex.getMessage();
            // Same sequential order id was already registered on payOS (DB reset / prior attempt).
            if (isPayOsDuplicateOrder(detail)) {
                try {
                    long retryCode = nextPayOsOrderCode(order.getId());
                    payOSPayment = payOSService.createPaymentLink(order, courses, amountVnd, retryCode);
                } catch (IllegalStateException retryEx) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_GATEWAY,
                            retryEx.getMessage() == null ? detail : retryEx.getMessage(),
                            retryEx
                    );
                }
            } else {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, detail, ex);
            }
        }

        if (!StringUtils.hasText(payOSPayment.qrCode()) && !StringUtils.hasText(payOSPayment.checkoutUrl())) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "payOS did not return qrCode or checkoutUrl");
        }

        payment.setTransactionId(payOSPayment.paymentLinkId());
        payment.setUpdatedAt(Instant.now());
        paymentRepository.save(payment);

        Course primaryCourse = courses.getFirst();
        List<String> courseTitles = courses.stream().map(Course::getTitle).toList();
        String courseTitle = String.join(" · ", courseTitles);

        return new CreatePaymentResponse(
                order.getId(),
                payment.getId(),
                primaryCourse.getId(),
                courseTitle,
                courseTitles,
                catalogSubtotal,
                catalogDiscount,
                catalogTotal,
                payOsAmount.displayUsd(),
                amountVnd,
                exchangeRate,
                RESPONSE_PAYMENT_METHOD,
                payment.getStatus().name(),
                order.getStatus().name(),
                payOSPayment.checkoutUrl(),
                payOSPayment.qrCode(),
                payOSPayment.paymentLinkId(),
                payOSPayment.expiresAt()
        );
    }

    @Transactional
    public PaymentStatusResponse getPaymentStatus(Long orderId) {
        User currentUser = getCurrentUser();
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        if (!isAdmin() && !order.getUser().getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot view this order");
        }
        Payment payment = paymentRepository.findFirstByOrderIdOrderByIdDesc(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));

        syncPayOSPaymentStatus(order, payment);

        return toStatusResponse(order, payment);
    }

    @Transactional
    public PaymentStatusResponse cancelPayment(Long orderId) {
        User currentUser = getCurrentUser();
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        if (!order.getUser().getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot cancel this order");
        }
        Payment payment = paymentRepository.findFirstByOrderIdOrderByIdDesc(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));

        syncPayOSPaymentStatus(order, payment);

        if (order.getStatus() == OrderStatus.PAID || payment.getStatus() == PaymentStatus.SUCCESS) {
            return toStatusResponse(order, payment);
        }

        if (order.getStatus() == OrderStatus.PENDING && payment.getStatus() == PaymentStatus.PENDING) {
            markOrderCancelled(order, payment);
        }

        return toStatusResponse(order, payment);
    }

    /**
     * Called by PayOS (not by the frontend) after a bank payment.
     * Job: verify → find order → check amount → unlock courses (or notify student if money-in but unlock fails).
     */
    @Transactional
    public void handlePayOSWebhook(JsonNode body) {
        try {
            if (!payOSService.isSuccessfulWebhook(body)) {
                // Not a successful payment event — ignore (cancel/fail can be synced via poll).
                return;
            }

            JsonNode data = body.path("data");
            String paymentLinkId = data.path("paymentLinkId").asText(null);
            Long payOsOrderCode = data.path("orderCode").canConvertToLong() ? data.path("orderCode").asLong() : null;
            String description = data.path("description").asText(null);

            Optional<Payment> paymentOpt = findPaymentForPayOSWebhookSafe(paymentLinkId, payOsOrderCode, description);
            if (paymentOpt.isEmpty()) {
                log.warn(
                        "payOS webhook: payment not found linkId={} orderCode={} desc={}",
                        paymentLinkId,
                        payOsOrderCode,
                        description
                );
                return;
            }

            Payment payment = paymentOpt.get();
            Order order = orderRepository.findByIdForPaymentUpdate(payment.getOrder().getId()).orElse(null);
            if (order == null) {
                log.warn("payOS webhook: order missing for paymentId={}", payment.getId());
                return;
            }

            // Already done — PayOS may retry the same webhook.
            if (payment.getStatus() == PaymentStatus.SUCCESS && order.getStatus() == OrderStatus.PAID) {
                return;
            }

            // Money arrived but amount does not match our DB charge → do not unlock; tell student.
            if (!isWebhookAmountMatching(data, payment)) {
                log.error(
                        "payOS webhook amount mismatch orderId={} expected={} actual={}",
                        order.getId(),
                        payment.getAmount(),
                        data.path("amount")
                );
                notifyStudentMoneyProblem(
                        order.getUser(),
                        order.getId(),
                        "Payment needs support",
                        "Your payment was received but the amount did not match order #"
                                + order.getId()
                                + ". Do not pay again — contact support."
                );
                return;
            }

            try {
                markOrderPaid(order, payment);
            } catch (RuntimeException unlockError) {
                // Bank/PayOS already succeeded; LearnOva unlock failed → student must be told.
                log.error(
                        "payOS webhook: money OK but unlock failed orderId={}: {}",
                        order.getId(),
                        unlockError.getMessage(),
                        unlockError
                );
                notifyStudentMoneyProblem(
                        order.getUser(),
                        order.getId(),
                        "Payment received — unlock failed",
                        "Your payment for order #"
                                + order.getId()
                                + " was received but courses could not be unlocked. Do not pay again — contact support."
                );
            }
        } catch (RuntimeException ex) {
            // Still return 200 from controller so PayOS does not retry forever; check logs.
            log.error("payOS webhook handling failed: {}", ex.getMessage(), ex);
        }
    }

    /** Survives rollback of the webhook transaction (REQUIRES_NEW inside NotificationService). */
    private void notifyStudentMoneyProblem(User user, Long orderId, String title, String message) {
        if (user == null) {
            return;
        }
        try {
            notificationService.createUrgent(
                    user,
                    NotificationType.GENERIC,
                    title,
                    message,
                    "/learnova/user/profile/courses",
                    Map.of("orderId", orderId)
            );
        } catch (RuntimeException notifyError) {
            log.error(
                    "Could not notify student about payment problem orderId={}: {}",
                    orderId,
                    notifyError.getMessage()
            );
        }
    }

    private void markOrderPaid(Order order, Payment payment) {
        if (payment.getStatus() == PaymentStatus.SUCCESS && order.getStatus() == OrderStatus.PAID) {
            return;
        }

        List<OrderItem> orderItems = orderItemRepository.findByOrderIdWithCourse(order.getId());
        if (orderItems.isEmpty()) {
            throw new IllegalStateException("Order item not found");
        }
        User user = order.getUser();
        boolean firstTimePaid = payment.getStatus() != PaymentStatus.SUCCESS;

        for (OrderItem orderItem : orderItems) {
            Course course = orderItem.getCourse();
            if (!enrollmentRepository.existsByIdCourseIdAndIdUserId(course.getId(), user.getId())) {
                EnrollmentId enrollmentId = new EnrollmentId();
                enrollmentId.setCourseId(course.getId());
                enrollmentId.setUserId(user.getId());

                Enrollment enrollment = new Enrollment();
                enrollment.setId(enrollmentId);
                enrollment.setCourse(course);
                enrollment.setUser(user);
                enrollment.setOrder(order);
                enrollment.setEnrolledAt(Instant.now());
                enrollment.setProgressPercent(0);
                enrollmentRepository.save(enrollment);

                notificationService.create(
                        course.getInstructor(),
                        NotificationType.NEW_ENROLLMENT,
                        "New student enrolled",
                        user.getFullName() + " enrolled in \"" + course.getTitle() + "\".",
                        "/learnova/teacher/students",
                        Map.of("courseId", course.getId(), "courseTitle", course.getTitle(), "studentId", user.getId())
                );
            }
        }

        order.setStatus(OrderStatus.PAID);
        order.setUpdatedAt(Instant.now());
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setPaidAt(OffsetDateTime.now());
        payment.setUpdatedAt(Instant.now());

        if (firstTimePaid) {
            notificationService.create(
                    user,
                    NotificationType.GENERIC,
                    "Payment successful",
                    "Your payment was confirmed. Courses are now available in My Courses.",
                    "/learnova/user/profile/courses",
                    Map.of("orderId", order.getId())
            );
        }
    }

    private void markOrderCancelled(Order order, Payment payment) {
        order.setStatus(OrderStatus.CANCELLED);
        order.setUpdatedAt(Instant.now());
        payment.setStatus(PaymentStatus.FAILED);
        payment.setUpdatedAt(Instant.now());
    }

    private void syncPayOSPaymentStatus(Order order, Payment payment) {
        if (order.getStatus() == OrderStatus.PAID || payment.getStatus() == PaymentStatus.SUCCESS) {
            return;
        }

        try {
            PayOSService.PayOSPaymentInfo payOSPayment;
            if (StringUtils.hasText(payment.getTransactionId())) {
                payOSPayment = payOSService.getPaymentInfo(payment.getTransactionId());
            } else {
                payOSPayment = payOSService.getPaymentInfo(order.getId());
            }
            if (StringUtils.hasText(payOSPayment.paymentLinkId())
                    && !payOSPayment.paymentLinkId().equals(payment.getTransactionId())) {
                payment.setTransactionId(payOSPayment.paymentLinkId());
            }

            String status = payOSPayment.status() == null ? "" : payOSPayment.status().trim().toUpperCase();
            if ("PAID".equals(status)) {
                if (!isPayOsAmountMatching(payOSPayment.amount(), payment)) {
                    log.error(
                            "payOS status amount mismatch orderId={} expected={} actual={}",
                            order.getId(),
                            payment.getAmount(),
                            payOSPayment.amount()
                    );
                    return;
                }
                Order lockedOrder = orderRepository.findByIdForPaymentUpdate(order.getId())
                        .orElseThrow(() -> new IllegalStateException("Order not found"));
                markOrderPaid(lockedOrder, payment);
                order.setStatus(lockedOrder.getStatus());
                order.setUpdatedAt(lockedOrder.getUpdatedAt());
                return;
            }

            if (("CANCELLED".equals(status) || "EXPIRED".equals(status))
                    && order.getStatus() == OrderStatus.PENDING
                    && payment.getStatus() == PaymentStatus.PENDING) {
                markOrderCancelled(order, payment);
            }
        } catch (RuntimeException ignored) {
            // Keep polling usable even if payOS status lookup is temporarily unavailable.
        }
    }

    private PaymentStatusResponse toStatusResponse(Order order, Payment payment) {
        List<OrderItem> orderItems = orderItemRepository.findByOrderIdWithCourse(order.getId());
        if (orderItems.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order item not found");
        }
        OrderItem primaryOrderItem = orderItems.getFirst();
        Course primaryCourse = primaryOrderItem.getCourse();
        List<String> courseTitles = orderItems.stream()
                .map(item -> item.getCourse().getTitle())
                .toList();
        String courseTitle = String.join(" · ", courseTitles);

        long amountVnd = payment.getAmount() == null
                ? 0L
                : payment.getAmount().setScale(0, RoundingMode.HALF_UP).longValue();

        return new PaymentStatusResponse(
                order.getId(),
                payment.getId(),
                order.getStatus().name(),
                payment.getStatus().name(),
                payment.getPaidAt(),
                primaryCourse.getId(),
                courseTitle,
                courseTitles,
                order.getTotalAmount(),
                order.getTotalAmount(),
                amountVnd
        );
    }

    private boolean isWebhookAmountMatching(JsonNode data, Payment payment) {
        if (!data.path("amount").canConvertToLong()) {
            return false;
        }
        return isPayOsAmountMatching(data.path("amount").asLong(), payment);
    }

    private boolean isPayOsAmountMatching(Long payOsAmount, Payment payment) {
        if (payOsAmount == null || payment.getAmount() == null) {
            return false;
        }
        long expected = payment.getAmount().setScale(0, RoundingMode.HALF_UP).longValue();
        return payOsAmount == expected;
    }

    /**
     * Catalog {@code base_price} is treated as USD for checkout.
     * PayOS amount (VND) = round(totalUsd × usdToVndRate).
     */
    private PayOsAmount toPayOsAmount(BigDecimal totalUsd, BigDecimal usdToVndRate) {
        if (totalUsd == null || totalUsd.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Total amount must be greater than 0 USD");
        }
        if (usdToVndRate == null || usdToVndRate.compareTo(BigDecimal.ONE) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid USD→VND exchange rate");
        }

        long amountVnd = totalUsd.multiply(usdToVndRate).setScale(0, RoundingMode.HALF_UP).longValue();

        if (amountVnd < MIN_PAYOS_AMOUNT_VND) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "PayOS amount must be at least " + MIN_PAYOS_AMOUNT_VND + " VND"
            );
        }
        if (amountVnd > MAX_PAYOS_AMOUNT_VND) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Pay amount is too large for payOS (max 10,000,000,000 VND). "
                            + "Your total " + totalUsd.toPlainString() + " USD × rate "
                            + usdToVndRate.toPlainString() + " = " + amountVnd
                            + " VND. Lower the course USD price (e.g. 39.99), then retry."
            );
        }

        return new PayOsAmount(amountVnd, totalUsd);
    }

    private record PayOsAmount(long amountVnd, BigDecimal displayUsd) {}

    private Voucher validateVoucher(String code, BigDecimal subtotal) {
        Voucher voucher = voucherRepository.findByCodeIgnoreCase(code.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Voucher not found"));
        OffsetDateTime now = OffsetDateTime.now();
        if (!Boolean.TRUE.equals(voucher.getIsActive())
                || now.isBefore(voucher.getStartDate())
                || now.isAfter(voucher.getEndDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Voucher is not active");
        }
        if (voucher.getUsageLimit() != null && voucher.getUsedCount() >= voucher.getUsageLimit()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Voucher usage limit reached");
        }
        if (voucher.getMinimumOrder() != null && subtotal.compareTo(voucher.getMinimumOrder()) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order does not meet voucher minimum amount");
        }
        return voucher;
    }

    private List<Course> resolveCheckoutCourses(CreatePaymentRequest request) {
        List<Long> courseIds = new ArrayList<>();
        if (request.courseIds() != null) {
            request.courseIds().stream()
                    .filter(id -> id != null && id > 0)
                    .forEach(courseIds::add);
        }
        if (request.courseId() != null && request.courseId() > 0) {
            courseIds.add(request.courseId());
        }
        if (courseIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one course is required");
        }

        LinkedHashSet<Long> uniqueCourseIds = new LinkedHashSet<>(courseIds);
        List<Course> courses = courseRepository.findAllById(uniqueCourseIds);
        if (courses.size() != uniqueCourseIds.size()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found");
        }

        return uniqueCourseIds.stream()
                .map(courseId -> courses.stream()
                        .filter(course -> course.getId().equals(courseId))
                        .findFirst()
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found")))
                .toList();
    }

    private void validateCheckoutCourses(List<Course> courses, User currentUser) {
        for (Course course : courses) {
            if (course.getStatus() != CourseStatus.PUBLISHED || Boolean.TRUE.equals(course.getIsDeleted())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Course is not available for purchase");
            }

            if (course.getInstructor().getId().equals(currentUser.getId())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "You cannot purchase your own course: " + course.getTitle()
                );
            }

            if (enrollmentRepository.existsByIdCourseIdAndIdUserId(course.getId(), currentUser.getId())) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "You are already enrolled in this course: " + course.getTitle()
                );
            }
        }
    }

    private BigDecimal calculateDiscount(Voucher voucher, BigDecimal subtotal) {
        BigDecimal discount;
        if (voucher.getDiscountType() == DiscountType.Percent) {
            discount = subtotal.multiply(voucher.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            if (voucher.getMaximumDiscountAmount() != null
                    && voucher.getMaximumDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
                discount = discount.min(voucher.getMaximumDiscountAmount());
            }
        } else {
            discount = voucher.getDiscountValue();
        }
        return discount.min(subtotal).max(BigDecimal.ZERO);
    }

    public boolean verifyPayOSWebhook(JsonNode body) {
        return payOSService.verifyWebhook(body);
    }

    /**
     * payOS orderCode is no longer our DB order id (must be unique on payOS forever).
     * Prefer paymentLinkId; else parse ORDER{id} from description; else legacy orderCode==orderId.
     */
    private Optional<Payment> findPaymentForPayOSWebhookSafe(
            String paymentLinkId, Long payOsOrderCode, String description) {
        if (StringUtils.hasText(paymentLinkId)) {
            Optional<Payment> byLink = paymentRepository.findByTransactionId(paymentLinkId);
            if (byLink.isPresent()) {
                return byLink;
            }
        }
        Long orderId = parseOrderIdFromDescription(description);
        if (orderId != null) {
            return paymentRepository.findFirstByOrderIdOrderByIdDesc(orderId);
        }
        if (payOsOrderCode != null) {
            return paymentRepository.findFirstByOrderIdOrderByIdDesc(payOsOrderCode);
        }
        return Optional.empty();
    }

    private Long parseOrderIdFromDescription(String description) {
        if (!StringUtils.hasText(description)) {
            return null;
        }
        String raw = description.trim();
        try {
            if (raw.regionMatches(true, 0, "ORDER", 0, 5)) {
                raw = raw.substring(5).trim();
                int space = raw.indexOf(' ');
                return Long.parseLong(space < 0 ? raw : raw.substring(0, space));
            }
            // Current createPayment uses bare order id (≤9 digits) as PayOS description.
            if (raw.chars().allMatch(Character::isDigit)) {
                return Long.parseLong(raw);
            }
        } catch (NumberFormatException ignored) {
            return null;
        }
        return null;
    }

    /** Unique per create attempt — payOS rejects reused orderCode even if unpaid. */
    private long nextPayOsOrderCode(long orderId) {
        // payOS stores orderCode forever on the merchant; DB order ids are reused after resets.
        return PAYOS_ORDER_CODE_SEQ.incrementAndGet();
    }

    private boolean isPayOsDuplicateOrder(String message) {
        if (message == null) {
            return false;
        }
        String m = message.toLowerCase();
        return m.contains("đã tồn tại") || m.contains("already exists") || m.contains("duplicate");
    }

    private PaymentMethod resolveStoredPaymentMethod() {
        try {
            return PaymentMethod.valueOf(RESPONSE_PAYMENT_METHOD);
        } catch (IllegalArgumentException ignored) {
            return PaymentMethod.VNPAY;
        }
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Object principal = authentication == null ? null : authentication.getPrincipal();
        if (principal instanceof CustomUserDetails userDetails) {
            return userRepository.findById(userDetails.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
    }

    private boolean isAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
    }
}
