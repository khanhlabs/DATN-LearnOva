package com.example.back_end.commerce.adapter.in.web;

import com.example.back_end.commerce.adapter.in.web.dto.ApplyVoucherResponse;
import com.example.back_end.commerce.adapter.in.web.dto.ApplyVoucherRequest;
import com.example.back_end.commerce.application.VoucherService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/learnova/vouchers")
public class VoucherController {

    private final VoucherService voucherService;

    public VoucherController(VoucherService voucherService) {
        this.voucherService = voucherService;
    }

    @PostMapping("/apply")
    public ApplyVoucherResponse applyVoucher(@Valid @RequestBody ApplyVoucherRequest request) {
        return voucherService.applyVoucher(request);
    }
}
