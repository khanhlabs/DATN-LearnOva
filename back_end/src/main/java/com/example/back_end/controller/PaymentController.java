package com.example.back_end.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.back_end.dto.request.CreatePaymentRequest;
import com.example.back_end.dto.response.CreatePaymentResponse;
import com.example.back_end.dto.response.PaymentStatusResponse;
import com.example.back_end.service.ExchangeRateService;
import com.example.back_end.service.PaymentService;
import com.fasterxml.jackson.databind.JsonNode;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/learnova/payments")
public class PaymentController {

    private final PaymentService paymentService;
    private final ExchangeRateService exchangeRateService;

    @GetMapping("/exchange-rate/usd-vnd")
    public ResponseEntity<Map<String, Object>> usdToVndRate() {
        var rate = exchangeRateService.getUsdToVnd();
        return ResponseEntity.ok(Map.of(
                "rate", rate,
                "from", "USD",
                "to", "VND"
        ));
    }

    @PostMapping("/create")
    public ResponseEntity<CreatePaymentResponse> createPayment(@Valid @RequestBody CreatePaymentRequest request) {
        return ResponseEntity.ok(paymentService.createPayment(request));
    }

    @GetMapping("/status/{orderId}")
    public ResponseEntity<PaymentStatusResponse> getPaymentStatus(@PathVariable Long orderId) {
        return ResponseEntity.ok(paymentService.getPaymentStatus(orderId));
    }

    @PostMapping("/cancel/{orderId}")
    public ResponseEntity<PaymentStatusResponse> cancelPayment(@PathVariable Long orderId) {
        return ResponseEntity.ok(paymentService.cancelPayment(orderId));
    }

    /**
     * Called by PayOS after payment (server → server). Frontend never calls this.
     * Steps: check signature → unlock courses if amount matches.
     */
    @PostMapping("/webhook")
    public ResponseEntity<Map<String, Object>> payOSWebhook(@RequestBody JsonNode body) {
        if (!paymentService.verifyPayOSWebhook(body)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "invalid signature"));
        }

        paymentService.handlePayOSWebhook(body);
        // Always 200 after valid signature so PayOS stops retrying; business errors are logged + notified.
        return ResponseEntity.ok(Map.of("message", "success"));
    }
}
