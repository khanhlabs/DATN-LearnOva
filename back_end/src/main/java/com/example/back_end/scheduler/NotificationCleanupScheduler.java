package com.example.back_end.scheduler;

import com.example.back_end.notification.application.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class NotificationCleanupScheduler {

    private static final int RETENTION_DAYS = 30;

    private final NotificationService notificationService;

    @Scheduled(cron = "0 0 3 * * *", zone = "Asia/Ho_Chi_Minh")
    public void cleanupReadNotifications() {
        notificationService.deleteReadOlderThan(RETENTION_DAYS);
    }
}
