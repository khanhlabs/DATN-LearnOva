package com.example.back_end.controller.teacher;

import com.example.back_end.commerce.adapter.in.web.dto.PayoutBalanceResponse;
import com.example.back_end.commerce.adapter.in.web.dto.PayoutRequestResponse;
import com.example.back_end.commerce.application.PayoutRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/learnova/teacher/payout-requests")
@RequiredArgsConstructor
@PreAuthorize("hasRole('TEACHER')")
public class TeacherPayoutController {

    private final PayoutRequestService payoutRequestService;

    @GetMapping("/balance")
    public PayoutBalanceResponse getBalance(Authentication authentication) {
        return payoutRequestService.getBalance(authentication.getName());
    }

    @GetMapping
    public List<PayoutRequestResponse> getMyHistory(Authentication authentication) {
        return payoutRequestService.getMyHistory(authentication.getName());
    }

}
