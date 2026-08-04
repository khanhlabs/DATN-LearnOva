package com.example.back_end.scheduler;

import com.example.back_end.entity.Enrollment;
import com.example.back_end.entity.enums.NotificationType;
import com.example.back_end.repository.EnrollmentRepository;
import com.example.back_end.repository.NotificationRepository;
import com.example.back_end.service.EmailService;
import com.example.back_end.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class LearningReminderScheduler {

    private final EnrollmentRepository enrollmentRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    @Value("${app.frontend.base-url:http://localhost:5173}")
    private String frontendUrl;

    @Scheduled(cron = "0 0 9 * * *", zone = "Asia/Ho_Chi_Minh")
    @Transactional
    public void sendLearningReminders() {
        Instant cutoff = Instant.now().minus(2, ChronoUnit.DAYS);
        for (Enrollment enrollment : enrollmentRepository.findIncompleteEnrollmentsBefore(cutoff)) {
            Long userId = enrollment.getUser().getId();
            Long courseId = enrollment.getCourse().getId();
            String link = "/learnova/user/courses-detail/" + courseId;

            if (notificationRepository.existsByUser_IdAndTypeAndLink(userId, NotificationType.LEARNING_REMINDER, link)) {
                continue;
            }

            String title = "Tiếp tục học nhé!";
            String content = "Bạn còn khóa học \"" + enrollment.getCourse().getTitle() + "\" chưa hoàn thành. Hãy quay lại học tiếp nhé!";
            notificationService.create(
                    enrollment.getUser(),
                    NotificationType.LEARNING_REMINDER,
                    title,
                    content,
                    link,
                    Map.of("courseId", courseId)
            );

            try {
                emailService.sendLearningReminderEmail(
                        enrollment.getUser().getEmail(),
                        enrollment.getUser().getFullName(),
                        enrollment.getCourse().getTitle(),
                        frontendUrl + link
                );
            } catch (Exception ex) {
                log.error("Failed to send learning reminder to user {} for course {}", userId, courseId, ex);
            }
        }
    }
}
