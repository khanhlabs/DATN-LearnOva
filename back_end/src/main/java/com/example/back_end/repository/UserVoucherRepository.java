package com.example.back_end.repository;

import com.example.back_end.entity.UserVoucher;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserVoucherRepository extends JpaRepository<UserVoucher, Long> {
    List<UserVoucher> findByUser_Id(Long userId);
    Optional<UserVoucher> findByUser_IdAndVoucher_Id(Long userId, Long voucherId);
}
