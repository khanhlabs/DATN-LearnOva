package com.example.back_end.service.admin;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.example.back_end.dto.request.admin.AdminVoucherRequest;
import com.example.back_end.dto.response.admin.AdminVoucherCampaignStatsResponse;
import com.example.back_end.dto.response.admin.AdminVoucherResponse;
import com.example.back_end.dto.response.admin.AdminVoucherUsageFrequencyResponse;
import com.example.back_end.dto.response.admin.AdminVoucherUsageHistoryResponse;
import com.example.back_end.entity.User;
import com.example.back_end.entity.Voucher;
import com.example.back_end.entity.enums.DiscountType;
import com.example.back_end.exception.BusinessException;
import com.example.back_end.exception.ResourceNotFoundException;
import com.example.back_end.repository.admin.AdminUserRepository;
import com.example.back_end.repository.admin.AdminVoucherRepository;

import jakarta.transaction.Transactional;

@Service
@Transactional
public class AdminVoucherService {

    private final AdminVoucherRepository voucherRepository;
    private final AdminUserRepository adminUserRepository;

    public AdminVoucherService(
            AdminVoucherRepository voucherRepository,
            AdminUserRepository adminUserRepository
    ) {
        this.voucherRepository = voucherRepository;
        this.adminUserRepository = adminUserRepository;
    }

    public List<AdminVoucherResponse> getAllVouchers() {
        List<Voucher> voucherList = voucherRepository.findAll();

        return voucherList.stream()
                .map(this::syncVoucherAvailability)
                .map(voucher -> new AdminVoucherResponse(
                        voucher.getId(),
                        voucher.getCode(),
                        voucher.getDescription(),
                        voucher.getDiscountType() == null ? null : voucher.getDiscountType().name(),
                        voucher.getDiscountValue(),
                        voucher.getMinimumOrder(),
                        voucher.getMaximumDiscountAmount(),
                        voucher.getUsageLimit(),
                        voucher.getUsedCount(),
                        voucher.getStartDate(),
                        voucher.getEndDate(),
                        voucher.getIsActive(),
                        voucher.getCreatedBy() == null ? null : voucher.getCreatedBy().getId(),
                        voucher.getCreatedAt(),
                        voucher.getUpdatedAt()
                ))
                .collect(Collectors.toList());
    }

    public List<AdminVoucherUsageHistoryResponse> getVoucherUsageHistories() {
        return voucherRepository.findVoucherUsageHistoryProjections().stream()
                .map(history -> new AdminVoucherUsageHistoryResponse(
                        history.getStudentName(),
                        history.getRegisteredCourse(),
                        history.getAppliedCode(),
                        history.getOriginalPrice(),
                        history.getDiscount(),
                        history.getPaid(),
                        history.getUsedAt()
                ))
                .collect(Collectors.toList());
    }

    public List<AdminVoucherUsageFrequencyResponse> getVoucherUsageFrequency() {
        return voucherRepository.findVoucherUsageFrequencyProjections().stream()
                .map(item -> new AdminVoucherUsageFrequencyResponse(
                        item.getMonth(),
                        item.getActivations()
                ))
                .collect(Collectors.toList());
    }

    public List<AdminVoucherCampaignStatsResponse> getVoucherCampaignStats() {
        return voucherRepository.findVoucherCampaignStats().stream()
                .map(stats -> new AdminVoucherCampaignStatsResponse(
                        stats.getCode(),
                        stats.getUsedCount(),
                        stats.getRevenue()
                ))
                .collect(Collectors.toList());
    }

    public AdminVoucherResponse getVoucherById(Long voucherId) {
        Voucher voucher = voucherRepository.findById(voucherId)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher not found id=" + voucherId));
        voucher = syncVoucherAvailability(voucher);

        return new AdminVoucherResponse(
                voucher.getId(),
                voucher.getCode(),
                voucher.getDescription(),
                voucher.getDiscountType() == null ? null : voucher.getDiscountType().name(),
                voucher.getDiscountValue(),
                voucher.getMinimumOrder(),
                voucher.getMaximumDiscountAmount(),
                voucher.getUsageLimit(),
                voucher.getUsedCount(),
                voucher.getStartDate(),
                voucher.getEndDate(),
                voucher.getIsActive(),
                voucher.getCreatedBy() == null ? null : voucher.getCreatedBy().getId(),
                voucher.getCreatedAt(),
                voucher.getUpdatedAt()
        );
    }

    public AdminVoucherResponse createVoucher(Authentication authentication, AdminVoucherRequest voucherRequest) {
        if (authentication == null) {
            throw new RuntimeException("No authentication - missing token or filter failed");
        }

        DiscountType discountType;

        try {
            String discountTypeValue = voucherRequest.discountType() == null
                    ? DiscountType.Fixed.name()
                    : voucherRequest.discountType().trim();
            discountType = DiscountType.valueOf(discountTypeValue);
        } catch (Exception exception) {
            throw new BusinessException("Invalid discount type: " + voucherRequest.discountType());
        }

        if (voucherRequest.discountValue() == null) {
            throw new BusinessException("Discount value is required");
        }

        if (voucherRequest.discountValue().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Discount value must be greater than 0");
        }

        if (discountType == DiscountType.Percent && voucherRequest.discountValue().compareTo(new BigDecimal("100")) > 0) {
            throw new BusinessException("Discount percent must be less than or equal to 100");
        }

        OffsetDateTime startDate;
        OffsetDateTime endDate;

        try {
            startDate = OffsetDateTime.parse(voucherRequest.startDate());
            endDate = OffsetDateTime.parse(voucherRequest.endDate());
        } catch (DateTimeParseException exception) {
            throw new BusinessException("Invalid date format");
        }

        if (!endDate.isAfter(startDate)) {
            throw new BusinessException("End date must be after start date");
        }

        if (voucherRequest.usageLimit() == null || voucherRequest.usageLimit() <= 0) {
            throw new BusinessException("Usage limit must be greater than 0");
        }

        User createdByUser = adminUserRepository.findByEmailAndIsDeletedFalse(authentication.getName(), false)
                .orElseThrow(() -> new ResourceNotFoundException("User not found email=" + authentication.getName()));

        Voucher voucher = new Voucher();
        voucher.setCode(voucherRequest.code().trim());
        voucher.setDescription(voucherRequest.description().trim());
        voucher.setDiscountType(discountType);
        voucher.setDiscountValue(voucherRequest.discountValue());
        voucher.setMinimumOrder(BigDecimal.ZERO);
        voucher.setMaximumDiscountAmount(
                discountType == DiscountType.Percent ? new BigDecimal("999999999") : BigDecimal.ZERO
        );
        voucher.setUsageLimit(voucherRequest.usageLimit());
        voucher.setUsedCount(0);
        voucher.setStartDate(startDate);
        voucher.setEndDate(endDate);
        voucher.setIsActive(voucherRequest.isActive());
        voucher.setCreatedBy(createdByUser);
        voucher.setCreatedAt(Instant.now());
        voucher.setUpdatedAt(Instant.now());

        Voucher savedVoucher = voucherRepository.save(voucher);

        return new AdminVoucherResponse(
                savedVoucher.getId(),
                savedVoucher.getCode(),
                savedVoucher.getDescription(),
                savedVoucher.getDiscountType() == null ? null : savedVoucher.getDiscountType().name(),
                savedVoucher.getDiscountValue(),
                savedVoucher.getMinimumOrder(),
                savedVoucher.getMaximumDiscountAmount(),
                savedVoucher.getUsageLimit(),
                savedVoucher.getUsedCount(),
                savedVoucher.getStartDate(),
                savedVoucher.getEndDate(),
                savedVoucher.getIsActive(),
                savedVoucher.getCreatedBy() == null ? null : savedVoucher.getCreatedBy().getId(),
                savedVoucher.getCreatedAt(),
                savedVoucher.getUpdatedAt()
        );
    }

    public AdminVoucherResponse updateVoucher(Long voucherId, AdminVoucherRequest voucherRequest ) {
        Voucher voucher = voucherRepository.findById(voucherId)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher not found id=" + voucherId));

        String voucherCode = voucherRequest.code().trim();
        String voucherDescription = voucherRequest.description().trim();
        DiscountType discountType;

        try {
            discountType = DiscountType.valueOf(voucherRequest.discountType());
        } catch (Exception exception) {
            throw new BusinessException("Invalid discount type: " + voucherRequest.discountType());
        }

        OffsetDateTime startDate;
        OffsetDateTime endDate;

        try {
            startDate = OffsetDateTime.parse(voucherRequest.startDate());
            endDate = OffsetDateTime.parse(voucherRequest.endDate());
        } catch (DateTimeParseException exception) {
            throw new BusinessException("Invalid date format");
        }

        if (!endDate.isAfter(startDate)) {
            throw new BusinessException("End date must be after start date");
        }

        if (voucherRequest.usageLimit() == null || voucherRequest.usageLimit() <= 0) {
            throw new BusinessException("Usage limit must be greater than 0");
        }

        User createdByUser = adminUserRepository.findById(voucherRequest.createdById())
                .orElseThrow(() -> new ResourceNotFoundException("User not found id=" + voucherRequest.createdById()));

        voucher.setCode(voucherCode);
        voucher.setDescription(voucherDescription);
        voucher.setDiscountType(discountType);
        voucher.setDiscountValue(voucherRequest.discountValue());
        voucher.setMinimumOrder(voucherRequest.minimumOrder());
        voucher.setMaximumDiscountAmount(voucherRequest.maximumDiscountAmount());
        voucher.setUsageLimit(voucherRequest.usageLimit());
        voucher.setStartDate(startDate);
        voucher.setEndDate(endDate);
        voucher.setIsActive(voucherRequest.isActive());
        voucher.setCreatedBy(createdByUser);
        voucher.setUpdatedAt(Instant.now());

        Voucher updatedVoucher = voucherRepository.save(voucher);

        return new AdminVoucherResponse(
                updatedVoucher.getId(),
                updatedVoucher.getCode(),
                updatedVoucher.getDescription(),
                updatedVoucher.getDiscountType() == null ? null : updatedVoucher.getDiscountType().name(),
                updatedVoucher.getDiscountValue(),
                updatedVoucher.getMinimumOrder(),
                updatedVoucher.getMaximumDiscountAmount(),
                updatedVoucher.getUsageLimit(),
                updatedVoucher.getUsedCount(),
                updatedVoucher.getStartDate(),
                updatedVoucher.getEndDate(),
                updatedVoucher.getIsActive(),
                updatedVoucher.getCreatedBy() == null ? null : updatedVoucher.getCreatedBy().getId(),
                updatedVoucher.getCreatedAt(),
                updatedVoucher.getUpdatedAt()
        );
    }

    public AdminVoucherResponse deleteVoucher(Long voucherId) {
        Voucher voucher = voucherRepository.findById(voucherId)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher not found id=" + voucherId));

        voucher.setIsActive(false);
        voucher.setUpdatedAt(Instant.now());

        Voucher deletedVoucher = voucherRepository.save(voucher);

        return new AdminVoucherResponse(
                deletedVoucher.getId(),
                deletedVoucher.getCode(),
                deletedVoucher.getDescription(),
                deletedVoucher.getDiscountType() == null ? null : deletedVoucher.getDiscountType().name(),
                deletedVoucher.getDiscountValue(),
                deletedVoucher.getMinimumOrder(),
                deletedVoucher.getMaximumDiscountAmount(),
                deletedVoucher.getUsageLimit(),
                deletedVoucher.getUsedCount(),
                deletedVoucher.getStartDate(),
                deletedVoucher.getEndDate(),
                deletedVoucher.getIsActive(),
                deletedVoucher.getCreatedBy() == null ? null : deletedVoucher.getCreatedBy().getId(),
                deletedVoucher.getCreatedAt(),
                deletedVoucher.getUpdatedAt()
        );
    }

    private Voucher syncVoucherAvailability(Voucher voucher) {
        boolean shouldDeactivate =
                Boolean.TRUE.equals(voucher.getIsActive())
                        && (isExpired(voucher) || isUsageLimitReached(voucher));

        if (!shouldDeactivate) {
            return voucher;
        }

        voucher.setIsActive(false);
        voucher.setUpdatedAt(Instant.now());
        return voucherRepository.save(voucher);
    }

    private boolean isExpired(Voucher voucher) {
        return voucher.getEndDate() != null && !voucher.getEndDate().isAfter(OffsetDateTime.now());
    }

    private boolean isUsageLimitReached(Voucher voucher) {
        Integer usageLimit = voucher.getUsageLimit();
        if (usageLimit == null || usageLimit <= 0) return true;
        return (voucher.getUsedCount() == null ? 0 : voucher.getUsedCount()) >= usageLimit;
    }
}
