package com.example.back_end.scheduler;

import com.example.back_end.auth.application.VerificationTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CleanupRefreshTokenByScheduler {

    private final VerificationTokenService verificationTokenService;

    @Scheduled(cron = "0 0 3 * * *", zone = "Asia/Ho_Chi_Minh")
    public void cleanupExpiredRefreshTokens() {
        verificationTokenService.deleteExpiredRefreshTokens();
    }
}
