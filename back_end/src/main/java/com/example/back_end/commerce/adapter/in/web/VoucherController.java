package com.example.back_end.commerce.adapter.in.web;

// import com.example.back_end.dto.response.ApplyVoucherResponse;
// import com.example.back_end.dto.response.UserVoucherResponse;
// import com.example.back_end.dto.request.ApplyVoucherRequest;
// import com.example.back_end.commerce.application.UserVoucherService;
// import com.example.back_end.service.VoucherService;
import com.example.back_end.assessment.adapter.in.web.dto.UserVoucherResponse;
import com.example.back_end.commerce.adapter.in.web.dto.ApplyVoucherResponse;
import com.example.back_end.commerce.adapter.in.web.dto.ApplyVoucherRequest;
import com.example.back_end.commerce.application.VoucherService;
import com.example.back_end.commerce.application.UserVoucherService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/learnova/vouchers")
public class VoucherController {

    private final VoucherService voucherService;
    private final UserVoucherService userVoucherService;

    public VoucherController(VoucherService voucherService, UserVoucherService userVoucherService) {
        this.voucherService = voucherService;
        this.userVoucherService = userVoucherService;
    }

    @PostMapping("/apply")
    public ApplyVoucherResponse applyVoucher(@Valid @RequestBody ApplyVoucherRequest request) {
        return voucherService.applyVoucher(request);
    }

    @GetMapping("/available")
    public List<UserVoucherResponse> getAvailableVouchers(java.security.Principal principal) {
        return userVoucherService.getAvailableVouchers(principal.getName());
    }

    @PostMapping("/{voucherId}/claim")
    public UserVoucherResponse claimVoucher(java.security.Principal principal, @PathVariable Long voucherId) {
        return userVoucherService.claimVoucher(principal.getName(), voucherId);
    }
}
