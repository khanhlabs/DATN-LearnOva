package com.example.back_end.service;

import com.example.back_end.entity.Course;
import com.example.back_end.entity.Order;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Iterator;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.TreeMap;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class PayOSService {

    private static final String CREATE_PAYMENT_LINK_ENDPOINT =
            "https://api-merchant.payos.vn/v2/payment-requests";

    /**
     * QR / payment-link validity (seconds) sent to PayOS as {@code expiredAt}.
     * This is the LearnOva-controlled TTL for each generated transfer QR.
     * Change here if product wants a different window (e.g. 10 or 30 minutes).
     */
    public static final int PAYOS_QR_TTL_SECONDS = 15 * 60; // 15 minutes

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Value("${payos.client-id:}")
    private String clientId;

    @Value("${payos.api-key:}")
    private String apiKey;

    @Value("${payos.checksum-key:}")
    private String checksumKey;

    @Value("${payos.return-url}")
    private String returnUrl;

    @Value("${payos.cancel-url}")
    private String cancelUrl;

    public PayOSCreatePaymentResult createPaymentLink(
            Order order, List<Course> courses, long amount, long orderCode) {
        try {
            // Non-linked bank accounts: PayOS limits transfer description to 9 chars.
            // Longer text still creates a link but VietQR often fails in banking apps.
            String description = payOsDescription(order.getId());

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("orderCode", orderCode);
            payload.put("amount", amount);
            payload.put("description", description);
            payload.put("returnUrl", returnUrl);
            payload.put("cancelUrl", cancelUrl);
            // === QR time limit (LearnOva) — see PAYOS_QR_TTL_SECONDS above ===
            // PayOS `expiredAt` = Unix seconds. After this time the transfer QR/link is invalid.
            long expiredAtUnix = Instant.now().getEpochSecond() + PAYOS_QR_TTL_SECONDS;
            payload.put("expiredAt", expiredAtUnix);
            // PayOS charge is one total amount. Course names are listed on LearnOva modal (courseTitles).
            String itemName = courses.size() == 1
                    ? truncateAscii(courses.getFirst().getTitle(), 40)
                    : "LearnOva " + order.getId() + " (" + courses.size() + " courses)";
            payload.put("items", List.of(Map.of(
                    "name", itemName,
                    "quantity", 1,
                    "price", amount
            )));
            payload.put("signature", createSignature(Map.of(
                    "amount", amount,
                    "cancelUrl", cancelUrl,
                    "description", description,
                    "orderCode", orderCode,
                    "returnUrl", returnUrl
            )));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(CREATE_PAYMENT_LINK_ENDPOINT))
                    .header("Content-Type", "application/json")
                    .header("x-client-id", clientId)
                    .header("x-api-key", apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode body = objectMapper.readTree(response.body());

            String code = body.path("code").asText("");
            if (!"00".equals(code)) {
                String message = body.path("desc").asText("payOS create payment link failed");
                throw new IllegalStateException(message);
            }

            JsonNode data = body.path("data");
            String qrCode = data.path("qrCode").asText(null);
            if (qrCode != null) {
                qrCode = qrCode.trim();
            }
            return new PayOSCreatePaymentResult(
                    data.path("checkoutUrl").asText(null),
                    qrCode,
                    data.path("paymentLinkId").asText(null),
                    parseExpiresAt(data),
                    orderCode
            );
        } catch (IOException e) {
            throw new IllegalStateException("Cannot call payOS create payment link", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("payOS create payment link interrupted", e);
        }
    }

    public PayOSPaymentInfo getPaymentInfo(long orderCode) {
        return getPaymentInfo(String.valueOf(orderCode));
    }

    /** Accepts payOS orderCode or paymentLinkId. */
    public PayOSPaymentInfo getPaymentInfo(String paymentLinkIdOrOrderCode) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(CREATE_PAYMENT_LINK_ENDPOINT + "/" + paymentLinkIdOrOrderCode))
                    .header("Content-Type", "application/json")
                    .header("x-client-id", clientId)
                    .header("x-api-key", apiKey)
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode body = objectMapper.readTree(response.body());

            String code = body.path("code").asText("");
            if (!"00".equals(code)) {
                String message = body.path("desc").asText("payOS get payment info failed");
                throw new IllegalStateException(message);
            }

            JsonNode data = body.path("data");
            return new PayOSPaymentInfo(
                    data.path("status").asText(null),
                    data.path("paymentLinkId").asText(null),
                    data.path("amount").canConvertToLong() ? data.path("amount").asLong() : null
            );
        } catch (IOException e) {
            throw new IllegalStateException("Cannot call payOS get payment info", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("payOS get payment info interrupted", e);
        }
    }

    public boolean verifyWebhook(JsonNode body) {
        JsonNode data = body.path("data");
        String signature = body.path("signature").asText(null);
        if (data.isMissingNode() || data.isNull() || signature == null || signature.isBlank()) {
            return false;
        }

        return hmacSha256(toSignatureData(data), checksumKey).equalsIgnoreCase(signature);
    }

    public boolean isSuccessfulWebhook(JsonNode body) {
        return body.path("success").asBoolean(false) || "00".equals(body.path("code").asText(""));
    }

    private String createSignature(Map<String, Object> values) {
        return hmacSha256(toSignatureData(values), checksumKey);
    }

    private String toSignatureData(Map<String, Object> values) {
        TreeMap<String, Object> sorted = new TreeMap<>(values);
        StringBuilder data = new StringBuilder();
        sorted.forEach((key, value) -> {
            if (!data.isEmpty()) {
                data.append("&");
            }
            data.append(key).append("=").append(formatSignatureValue(value));
        });
        return data.toString();
    }

    private String toSignatureData(JsonNode node) {
        TreeMap<String, JsonNode> sorted = new TreeMap<>();
        Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
        while (fields.hasNext()) {
            Map.Entry<String, JsonNode> field = fields.next();
            sorted.put(field.getKey(), field.getValue());
        }

        StringBuilder data = new StringBuilder();
        sorted.forEach((key, value) -> {
            if (!data.isEmpty()) {
                data.append("&");
            }
            data.append(key).append("=").append(formatSignatureValue(value));
        });
        return data.toString();
    }

    private String formatSignatureValue(Object value) {
        if (value == null) {
            return "";
        }
        if (value instanceof JsonNode node) {
            if (node.isNull() || node.isMissingNode()) {
                return "";
            }
            if (node.isTextual()) {
                return node.asText();
            }
            if (node.isNumber() || node.isBoolean()) {
                return node.asText();
            }
            try {
                return objectMapper.writeValueAsString(node);
            } catch (JsonProcessingException e) {
                throw new IllegalStateException("Cannot build payOS signature data", e);
            }
        }
        if (value instanceof BigDecimal number) {
            return number.stripTrailingZeros().toPlainString();
        }
        return String.valueOf(value);
    }

    private String hmacSha256(String data, String key) {
        try {
            Mac hmac = Mac.getInstance("HmacSHA256");
            hmac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] bytes = hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(bytes.length * 2);
            for (byte b : bytes) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new IllegalStateException("Cannot create payOS signature", e);
        }
    }

    /** PayOS transfer content: max 9 chars when bank is not linked via payOS. */
    static String payOsDescription(long orderId) {
        String id = Long.toString(orderId);
        return id.length() <= 9 ? id : id.substring(id.length() - 9);
    }

    private static String truncateAscii(String value, int maxLen) {
        if (value == null || value.isBlank()) {
            return "Course";
        }
        String cleaned = value.replaceAll("[^\\p{Alnum}\\s\\-_.]", " ").trim().replaceAll("\\s+", " ");
        if (cleaned.isEmpty()) {
            cleaned = "Course";
        }
        return cleaned.length() <= maxLen ? cleaned : cleaned.substring(0, maxLen).trim();
    }

    private OffsetDateTime parseExpiresAt(JsonNode data) {
        JsonNode expiredAtNode = data.get("expiredAt");
        if (expiredAtNode == null || expiredAtNode.isNull()) {
            return null;
        }
        try {
            if (expiredAtNode.isNumber()) {
                return Instant.ofEpochSecond(expiredAtNode.asLong()).atOffset(ZoneOffset.UTC);
            }
            String expiredAt = expiredAtNode.asText(null);
            if (expiredAt == null || expiredAt.isBlank()) {
                return null;
            }
            if (expiredAt.chars().allMatch(Character::isDigit)) {
                return Instant.ofEpochSecond(Long.parseLong(expiredAt)).atOffset(ZoneOffset.UTC);
            }
            return OffsetDateTime.parse(expiredAt);
        } catch (RuntimeException ignored) {
            return null;
        }
    }

    public record PayOSCreatePaymentResult(
            String checkoutUrl,
            String qrCode,
            String paymentLinkId,
            OffsetDateTime expiresAt,
            long orderCode
    ) {}

    public record PayOSPaymentInfo(
            String status,
            String paymentLinkId,
            Long amount
    ) {}
}
