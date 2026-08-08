package com.example.back_end.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "user_vouchers", uniqueConstraints = @UniqueConstraint(name = "uq_user_vouchers_user_voucher", columnNames = {"user_id", "voucher_id"}))
public class UserVoucher {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_voucher_id", nullable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "voucher_id", nullable = false)
    private Voucher voucher;

    @Column(name = "claimed_at", nullable = false)
    private OffsetDateTime claimedAt;

    @Column(name = "used_at")
    private OffsetDateTime usedAt;

    @Column(name = "status", nullable = false, length = 20)
    private String status;
}
