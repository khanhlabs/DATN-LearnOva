package com.example.back_end.auth.infrastructure.persistence;

import com.example.back_end.auth.domain.User;
import com.example.back_end.auth.domain.VerificationToken;
import com.example.back_end.auth.domain.enums.VerificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.Optional;

public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {
    Optional<VerificationToken> findByTokenAndTokenTypeAndIsUsedFalse(String token, VerificationType tokenType);

    void deleteByUserAndTokenType(User user, VerificationType tokenType);

    @Modifying
    @Query("""
        DELETE FROM VerificationToken  v WHERE v.tokenType = :tokenType
            AND v.expiredAt < :now
    """)
    int deleteExpiredTokens(
            @Param("tokenType") VerificationType tokenType,
            @Param("now") OffsetDateTime now
    );
}