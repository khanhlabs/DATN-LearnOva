package com.example.back_end.service;

import com.example.back_end.entity.InstructorProfile;
import com.example.back_end.entity.PayoutRequest;
import com.example.back_end.entity.enums.NotificationType;
import com.example.back_end.entity.enums.PayoutRequestStatus;
import com.example.back_end.repository.InstructorProfileRepository;
import com.example.back_end.repository.PayoutRequestRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.StringUtils;

@Slf4j
@Service
public class PayOsPayoutService {

    private static final String PAYOUT_ENDPOINT = "https://api-merchant.payos.vn/v1/payouts";
    private static final String BANK_BIN_KEY = "bankBin";
    private static final String BANK_ACCOUNT_KEY = "bankAccountNumber";

    private final PayoutRequestRepository payoutRequestRepository;
    private final InstructorProfileRepository instructorProfileRepository;
    private final NotificationService notificationService;
    private final TransactionTemplate transactionTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Value("${payos.client-id:}")
    private String clientId;

    @Value("${payos.api-key:}")
    private String apiKey;

    @Value("${payos.checksum-key:}")
    private String checksumKey;

    public PayOsPayoutService(
            PayoutRequestRepository payoutRequestRepository,
            InstructorProfileRepository instructorProfileRepository,
            NotificationService notificationService,
            PlatformTransactionManager transactionManager) {
        this.payoutRequestRepository = payoutRequestRepository;
        this.instructorProfileRepository = instructorProfileRepository;
        this.notificationService = notificationService;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void afterPaymentCommit(AutomaticPayoutService.AutomaticPayoutCreated event) {
        process(event.payoutRequestId());
    }

    /** Keeps committed payouts recoverable if the process stopped before the after-commit listener ran. */
    @Scheduled(fixedDelay = 60_000)
    public void recoverPendingPayouts() {
        if (!isConfigured()) {
            return;
        }
        payoutRequestRepository.findByStatusOrderByCreatedAtAsc(PayoutRequestStatus.PENDING)
                .stream()
                .limit(100)
                .map(PayoutRequest::getId)
                .forEach(this::process);
    }

    public void process(Long payoutRequestId) {
        if (!isConfigured()) {
            log.debug("PayOS payout is disabled or credentials are incomplete; payoutId={} remains PENDING", payoutRequestId);
            return;
        }

        PayoutTarget target = transactionTemplate.execute(status -> loadTarget(payoutRequestId));
        if (target == null) {
            return;
        }

        try {
            PayOsState existing = findByReference(target.referenceId());
            PayOsState result = existing == null ? createPayout(target) : existing;
            applyResult(target.payoutRequestId(), result);
        } catch (UncertainPayoutException ex) {
            appendPendingNote(target.payoutRequestId(), "payosState=UNKNOWN; " + ex.getMessage());
            log.warn("PayOS payout result is uncertain payoutId={}: {}", payoutRequestId, ex.getMessage());
        } catch (RejectedPayoutException ex) {
            reject(target.payoutRequestId(), ex.getMessage());
        }
    }

    private PayoutTarget loadTarget(Long payoutRequestId) {
        PayoutRequest payout = payoutRequestRepository.findByIdForUpdate(payoutRequestId).orElse(null);
        if (payout == null || payout.getStatus() != PayoutRequestStatus.PENDING) {
            return null;
        }
        InstructorProfile profile = instructorProfileRepository.findByUserId(payout.getTeacher().getId()).orElse(null);
        Map<String, String> bankData = profile == null ? null : profile.getSocialLinks();
        String bankBin = bankData == null ? null : bankData.get(BANK_BIN_KEY);
        String accountNumber = bankData == null ? null : bankData.get(BANK_ACCOUNT_KEY);
        if (!StringUtils.hasText(bankBin) || !StringUtils.hasText(accountNumber)) {
            payout.setStatus(PayoutRequestStatus.REJECTED);
            payout.setRejectionReason("Thiếu bankBin hoặc bankAccountNumber trong hồ sơ giảng viên");
            payout.setProcessedAt(Instant.now());
            return null;
        }
        return new PayoutTarget(
                payout.getId(),
                "LEARNOVA_PAYOUT_" + payout.getId(),
                payout.getAmount(),
                bankBin.trim(),
                accountNumber.trim());
    }

    private PayOsState findByReference(String referenceId) {
        String url = PAYOUT_ENDPOINT + "?limit=10&offset=0&referenceId="
                + URLEncoder.encode(referenceId, StandardCharsets.UTF_8);
        JsonNode body = send(HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("x-client-id", clientId)
                .header("x-api-key", apiKey)
                .GET()
                .build(), false);
        JsonNode payouts = body.path("data").path("payouts");
        if (!payouts.isArray() || payouts.isEmpty()) {
            return null;
        }
        return stateOf(payouts.get(0));
    }

    private PayOsState createPayout(PayoutTarget target) {
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("referenceId", target.referenceId());
            payload.put("amount", target.amount().longValueExact());
            payload.put("description", "LearnOva payout " + target.payoutRequestId());
            payload.put("toBin", target.bankBin());
            payload.put("toAccountNumber", target.accountNumber());
            String json = objectMapper.writeValueAsString(payload);

            JsonNode body = send(HttpRequest.newBuilder()
                    .uri(URI.create(PAYOUT_ENDPOINT))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/json")
                    .header("x-client-id", clientId)
                    .header("x-api-key", apiKey)
                    .header("x-idempotency-key", target.referenceId())
                    .header("x-signature", hmacSha256(json, checksumKey))
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build(), true);
            return stateOf(body.path("data"));
        } catch (ArithmeticException ex) {
            throw new RejectedPayoutException("Số tiền payout không phải số nguyên VND");
        } catch (IOException ex) {
            throw new RejectedPayoutException("Không thể tạo payload PayOS");
        }
    }

    private JsonNode send(HttpRequest request, boolean creating) {
        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode body = objectMapper.readTree(response.body());
            if (response.statusCode() >= 500 || response.statusCode() == 429) {
                throw new UncertainPayoutException("PayOS tạm thời không phản hồi chắc chắn (HTTP " + response.statusCode() + ")");
            }
            if (response.statusCode() >= 400 || !"00".equals(body.path("code").asText())) {
                String message = body.path("desc").asText("PayOS từ chối lệnh chi");
                if (creating) {
                    throw new RejectedPayoutException(message);
                }
                throw new UncertainPayoutException(message);
            }
            return body;
        } catch (IOException ex) {
            throw new UncertainPayoutException("Không kết nối được PayOS");
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new UncertainPayoutException("Luồng gọi PayOS bị gián đoạn");
        }
    }

    private PayOsState stateOf(JsonNode payout) {
        String state = payout.path("approvalState").asText("");
        if (state.isBlank() && payout.path("transactions").isArray() && !payout.path("transactions").isEmpty()) {
            state = payout.path("transactions").get(0).path("state").asText("");
        }
        return new PayOsState(payout.path("id").asText(null), state.toUpperCase());
    }

    private void applyResult(Long payoutId, PayOsState result) {
        String state = result.state();
        if ("SUCCEEDED".equals(state) || "SUCCESS".equals(state) || "PAID".equals(state)) {
            transactionTemplate.executeWithoutResult(status -> {
                PayoutRequest payout = payoutRequestRepository.findByIdForUpdate(payoutId).orElse(null);
                if (payout == null || payout.getStatus() != PayoutRequestStatus.PENDING) return;
                payout.setStatus(PayoutRequestStatus.PAID);
                payout.setProcessedAt(Instant.now());
                payout.setRejectionReason(null);
                appendNote(payout, "payosId=" + result.payosId() + "; payosState=" + state);
                notificationService.create(
                        payout.getTeacher(), NotificationType.PAYOUT_PAID, "Payout completed",
                        "LearnOva đã chuyển " + payout.getAmount() + " VND cho bạn.",
                        "/learnova/teacher/revenue", Map.of("payoutRequestId", payout.getId()));
            });
        } else if (List.of("FAILED", "REJECTED", "CANCELLED").contains(state)) {
            reject(payoutId, "PayOS payout " + state + (result.payosId() == null ? "" : " (" + result.payosId() + ")"));
        } else {
            appendPendingNote(payoutId, "payosId=" + result.payosId() + "; payosState=" + (state.isBlank() ? "PROCESSING" : state));
        }
    }

    private void appendPendingNote(Long payoutId, String note) {
        transactionTemplate.executeWithoutResult(status -> payoutRequestRepository.findByIdForUpdate(payoutId)
                .filter(p -> p.getStatus() == PayoutRequestStatus.PENDING)
                .ifPresent(p -> appendNote(p, note)));
    }

    private void reject(Long payoutId, String reason) {
        transactionTemplate.executeWithoutResult(status -> payoutRequestRepository.findByIdForUpdate(payoutId)
                .filter(p -> p.getStatus() == PayoutRequestStatus.PENDING)
                .ifPresent(p -> {
                    p.setStatus(PayoutRequestStatus.REJECTED);
                    p.setRejectionReason(reason);
                    p.setProcessedAt(Instant.now());
                }));
    }

    private void appendNote(PayoutRequest payout, String value) {
        if (payout.getNotes() == null || !payout.getNotes().contains(value)) {
            payout.setNotes((payout.getNotes() == null ? "" : payout.getNotes() + " | ") + value);
        }
    }

    private boolean isConfigured() {
        return StringUtils.hasText(clientId) && StringUtils.hasText(apiKey) && StringUtils.hasText(checksumKey);
    }

    private String hmacSha256(String data, String key) {
        try {
            Mac hmac = Mac.getInstance("HmacSHA256");
            hmac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return java.util.HexFormat.of().formatHex(hmac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException | InvalidKeyException ex) {
            throw new IllegalStateException("Cannot create PayOS payout signature", ex);
        }
    }

    private record PayoutTarget(Long payoutRequestId, String referenceId, BigDecimal amount, String bankBin, String accountNumber) {}
    private record PayOsState(String payosId, String state) {}
    private static final class UncertainPayoutException extends RuntimeException { private UncertainPayoutException(String m) { super(m); } }
    private static final class RejectedPayoutException extends RuntimeException { private RejectedPayoutException(String m) { super(m); } }
}
