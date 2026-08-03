package com.example.back_end.service;

import com.example.back_end.dto.response.ApplyVoucherResponse;
import com.example.back_end.dto.request.ApplyVoucherRequest;
import com.example.back_end.entity.Voucher;
import com.example.back_end.entity.enums.DiscountType;
import com.example.back_end.exception.BusinessException;
import com.example.back_end.repository.VoucherRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.OffsetDateTime;

@Service
@Transactional
public class VoucherService {

    private final VoucherRepository voucherRepository;

    public VoucherService(VoucherRepository voucherRepository) {
        this.voucherRepository = voucherRepository;
    }

    public ApplyVoucherResponse applyVoucher(ApplyVoucherRequest request) {
        String code = request.code() == null ? "" : request.code().trim();
        BigDecimal subtotal = request.subtotal() == null ? BigDecimal.ZERO : request.subtotal();

        if (code.isBlank()) {
            throw new BusinessException("Voucher code is required");
        }

        if (subtotal.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Cart total must be greater than 0");
        }

        Voucher voucher = voucherRepository.findByCodeIgnoreCase(code)
                .orElseThrow(() -> new BusinessException("Voucher không tồn tại."));

        OffsetDateTime now = OffsetDateTime.now();
        if (isExpired(voucher, now)) {
            deactivateVoucher(voucher);
            throw new BusinessException("Voucher đã hết hạn.");
        }

        if (isUsageLimitReached(voucher)) {
            deactivateVoucher(voucher);
            throw new BusinessException("Voucher đã hết số lượt sử dụng.");
        }

        if (!Boolean.TRUE.equals(voucher.getIsActive())) {
            throw new BusinessException("Voucher không còn hoạt động.");
        }

        if (voucher.getStartDate() != null && now.isBefore(voucher.getStartDate())) {
            throw new BusinessException("Voucher chưa đến thời gian sử dụng.");
        }

        if (voucher.getMinimumOrder() != null && subtotal.compareTo(voucher.getMinimumOrder()) < 0) {
            throw new BusinessException("Đơn hàng chưa đạt giá trị tối thiểu để dùng voucher.");
        }

        BigDecimal discountAmount = calculateDiscount(voucher, subtotal);
        int nextUsedCount = (voucher.getUsedCount() == null ? 0 : voucher.getUsedCount()) + 1;
        voucher.setUsedCount(nextUsedCount);
        if (voucher.getUsageLimit() != null && voucher.getUsageLimit() > 0 && nextUsedCount >= voucher.getUsageLimit()) {
            voucher.setIsActive(false);
        }
        voucher.setUpdatedAt(Instant.now());

        Voucher savedVoucher = voucherRepository.save(voucher);
        BigDecimal total = subtotal.subtract(discountAmount).max(BigDecimal.ZERO);

        return new ApplyVoucherResponse(
                savedVoucher.getId(),
                savedVoucher.getCode(),
                savedVoucher.getDiscountType() == null ? null : savedVoucher.getDiscountType().name(),
                savedVoucher.getDiscountValue(),
                discountAmount,
                subtotal,
                total,
                savedVoucher.getUsageLimit(),
                savedVoucher.getUsedCount(),
                savedVoucher.getIsActive()
        );
    }

    private BigDecimal calculateDiscount(Voucher voucher, BigDecimal subtotal) {
        BigDecimal discountValue = voucher.getDiscountValue() == null ? BigDecimal.ZERO : voucher.getDiscountValue();
        BigDecimal discountAmount;

        if (voucher.getDiscountType() == DiscountType.Percent) {
            discountAmount = subtotal
                    .multiply(discountValue)
                    .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

            BigDecimal maximumDiscount = voucher.getMaximumDiscountAmount();
            if (maximumDiscount != null && maximumDiscount.compareTo(BigDecimal.ZERO) > 0) {
                discountAmount = discountAmount.min(maximumDiscount);
            }
        } else {
            discountAmount = discountValue;
        }

        return discountAmount.max(BigDecimal.ZERO).min(subtotal);
    }

    private boolean isExpired(Voucher voucher, OffsetDateTime now) {
        return voucher.getEndDate() != null && !voucher.getEndDate().isAfter(now);
    }

    private boolean isUsageLimitReached(Voucher voucher) {
        Integer usageLimit = voucher.getUsageLimit();
        if (usageLimit == null || usageLimit <= 0) return true;
        return (voucher.getUsedCount() == null ? 0 : voucher.getUsedCount()) >= usageLimit;
    }

    private void deactivateVoucher(Voucher voucher) {
        voucher.setIsActive(false);
        voucher.setUpdatedAt(Instant.now());
        voucherRepository.save(voucher);
    }
}
