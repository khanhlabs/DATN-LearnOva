package com.example.back_end.controller.admin;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.back_end.dto.response.admin.AdminVoucherResponse;
import com.example.back_end.dto.response.admin.AdminVoucherUsageFrequencyResponse;
import com.example.back_end.dto.response.admin.AdminVoucherUsageHistoryResponse;
import com.example.back_end.dto.response.admin.AdminVoucherCampaignStatsResponse;
import com.example.back_end.dto.request.admin.AdminVoucherRequest;
import com.example.back_end.service.admin.AdminVoucherService;

@RestController
@RequestMapping("/api/learnova/admin/vouchers")
public class AdminVoucherController {

    private final AdminVoucherService voucherService;

    public AdminVoucherController(AdminVoucherService voucherService) {
        this.voucherService = voucherService;
    }

    @GetMapping
    public List<AdminVoucherResponse> getAllVouchers() {
        return voucherService.getAllVouchers();
    }

    @GetMapping("/usage-history")
    public List<AdminVoucherUsageHistoryResponse> getVoucherUsageHistories() {
        return voucherService.getVoucherUsageHistories();
    }

    @GetMapping("/usage-frequency")
    public List<AdminVoucherUsageFrequencyResponse> getVoucherUsageFrequency() {
        return voucherService.getVoucherUsageFrequency();
    }

    @GetMapping("/campaign-stats")
    public List<AdminVoucherCampaignStatsResponse> getVoucherCampaignStats() {
        return voucherService.getVoucherCampaignStats();
    }

    @GetMapping("/{voucherId}")
    public AdminVoucherResponse getVoucherById(@PathVariable Long voucherId) {
        return voucherService.getVoucherById(voucherId);
    }

    @PostMapping("/create")
    public AdminVoucherResponse createVoucher(
            Authentication authentication,
            @RequestBody AdminVoucherRequest voucherRequest
    ) {
        return voucherService.createVoucher(authentication, voucherRequest);
    }

    @PutMapping("/update/{voucherId}")
    public AdminVoucherResponse updateVoucher(
            @PathVariable Long voucherId,
            @RequestBody AdminVoucherRequest voucherRequest
    ) {
        return voucherService.updateVoucher(voucherId, voucherRequest);
    }

    @DeleteMapping("/delete/{voucherId}")
    public AdminVoucherResponse deleteVoucher(@PathVariable Long voucherId) {
        return voucherService.deleteVoucher(voucherId);
    }
}
