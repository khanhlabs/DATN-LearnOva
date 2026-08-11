package com.example.back_end.commerce.application;

import com.example.back_end.assessment.adapter.in.web.dto.UserVoucherResponse;
import com.example.back_end.auth.domain.User;
import com.example.back_end.entity.UserVoucher;
import com.example.back_end.commerce.domain.Voucher;
import com.example.back_end.shared.exception.BusinessException;
import com.example.back_end.shared.exception.ResourceNotFoundException;
import com.example.back_end.auth.infrastructure.persistence.UserRepository;
import com.example.back_end.commerce.infrastructure.persistence.UserVoucherRepository;
import com.example.back_end.commerce.infrastructure.persistence.VoucherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class UserVoucherService {
    private final UserRepository userRepository;
    private final UserVoucherRepository userVoucherRepository;
    private final VoucherRepository voucherRepository;

    @Transactional(readOnly = true)
    public List<UserVoucherResponse> getAvailableVouchers(String email) {
        User user = getUser(email);
        Map<Long, UserVoucher> claimed = userVoucherRepository.findByUser_Id(user.getId()).stream()
                .collect(Collectors.toMap(item -> item.getVoucher().getId(), Function.identity()));
        OffsetDateTime now = OffsetDateTime.now();

        return voucherRepository.findAll().stream()
                .filter(voucher -> isAvailable(voucher, now))
                .map(voucher -> toResponse(voucher, claimed.get(voucher.getId())))
                .toList();
    }

    public UserVoucherResponse claimVoucher(String email, Long voucherId) {
        User user = getUser(email);
        Voucher voucher = voucherRepository.findById(voucherId)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher không tồn tại."));

        if (userVoucherRepository.findByUser_IdAndVoucher_Id(user.getId(), voucherId).isPresent()) {
            throw new BusinessException("Bạn đã nhận voucher này rồi.");
        }
        if (!isAvailable(voucher, OffsetDateTime.now())) {
            throw new BusinessException("Voucher không còn khả dụng.");
        }

        UserVoucher userVoucher = new UserVoucher();
        userVoucher.setUser(user);
        userVoucher.setVoucher(voucher);
        userVoucher.setClaimedAt(OffsetDateTime.now());
        userVoucher.setStatus("CLAIMED");
        return toResponse(voucher, userVoucherRepository.save(userVoucher));
    }

    private User getUser(String email) {
        return userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private boolean isAvailable(Voucher voucher, OffsetDateTime now) {
        int used = voucher.getUsedCount() == null ? 0 : voucher.getUsedCount();
        int limit = voucher.getUsageLimit() == null ? 0 : voucher.getUsageLimit();
        return Boolean.TRUE.equals(voucher.getIsActive())
                && (voucher.getStartDate() == null || !now.isBefore(voucher.getStartDate()))
                && (voucher.getEndDate() == null || now.isBefore(voucher.getEndDate()))
                && (limit <= 0 || used < limit);
    }

    private UserVoucherResponse toResponse(Voucher voucher, UserVoucher claimed) {
        return new UserVoucherResponse(
                claimed == null ? null : claimed.getId(),
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
                claimed != null,
                claimed == null ? null : claimed.getClaimedAt(),
                claimed == null ? "AVAILABLE" : claimed.getStatus()
        );
    }
}
