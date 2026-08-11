package com.example.back_end.controller.admin;

import com.example.back_end.commerce.adapter.in.web.dto.PayoutRequestResponse;
import com.example.back_end.commerce.application.PayoutRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/learnova/admin/payout-requests")
@RequiredArgsConstructor
public class AdminPayoutController {

    private final PayoutRequestService payoutRequestService;

    @GetMapping
    public List<PayoutRequestResponse> listAll() {
        return payoutRequestService.listAll();
    }

    @GetMapping("/{id}")
    public PayoutRequestResponse getById(@PathVariable Long id) {
        return payoutRequestService.getById(id);
    }

}
