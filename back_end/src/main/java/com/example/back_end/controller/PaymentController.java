package com.example.back_end.controller;

import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.back_end.dto.request.CreatePaymentRequest;
import com.example.back_end.dto.response.CreatePaymentResponse;
import com.example.back_end.dto.response.PaymentHistoryDetailResponse;
import com.example.back_end.dto.response.PaymentHistoryResponse;
import com.example.back_end.dto.response.PaymentStatusResponse;
import com.example.back_end.service.ExchangeRateService;
import com.example.back_end.service.PaymentHistoryService;
import com.example.back_end.service.PaymentService;
import com.fasterxml.jackson.databind.JsonNode;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/learnova/payments")
public class PaymentController {

    private final PaymentService paymentService;
    private final PaymentHistoryService paymentHistoryService;
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

    @GetMapping("/history")
    public ResponseEntity<Page<PaymentHistoryResponse>> getPaymentHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String search
    ) {
        return ResponseEntity.ok(paymentHistoryService.getHistory(
                status, from, to, search, toPageable(page, size)
        ));
    }

    @GetMapping("/history/{orderId}")
    public ResponseEntity<PaymentHistoryDetailResponse> getPaymentHistoryDetail(
            @PathVariable Long orderId
    ) {
        return ResponseEntity.ok(paymentHistoryService.getDetail(orderId));
    }

    @GetMapping("/history/{orderId}/invoice")
    public ResponseEntity<byte[]> downloadPaymentReceipt(@PathVariable Long orderId) {
        byte[] receipt = paymentHistoryService.generateReceipt(orderId);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=learnova-payment-receipt-" + orderId + ".pdf")
                .body(receipt);
    }

    private Pageable toPageable(int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 50);
        return PageRequest.of(safePage, safeSize, Sort.unsorted());
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
