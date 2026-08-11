package com.example.back_end.admin.adapter.in.web.dto;

import java.math.BigDecimal;

/**
 * Response DTO for voucher campaign statistics
 * Shows aggregated usage and revenue data for each voucher code
 */
public record AdminVoucherCampaignStatsResponse(
        String code,
        Long usedCount,
        BigDecimal revenue
) {}
