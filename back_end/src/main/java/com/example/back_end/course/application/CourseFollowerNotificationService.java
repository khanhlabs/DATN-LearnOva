package com.example.back_end.course.application;

import com.example.back_end.auth.domain.User;
import com.example.back_end.auth.infrastructure.EmailService;
import com.example.back_end.course.application.event.CoursePublishedEvent;
import com.example.back_end.notification.application.NotificationService;
import com.example.back_end.notification.domain.enums.NotificationType;
import com.example.back_end.user.infrastructure.persistence.InstructorFollowRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CourseFollowerNotificationService {

    private final InstructorFollowRepository instructorFollowRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    @Value("${app.frontend.base-url}")
    private String frontendBaseUrl;

    /**
     * Fires only after the publishing transaction succeeds, preventing notifications or email for a rolled-back approval.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifyFollowers(CoursePublishedEvent event) {
        List<User> followers = instructorFollowRepository.findActiveFollowersByInstructorId(event.instructorId());
        if (followers.isEmpty()) {
            return;
        }

        String coursePath = "/learnova/user/CoursesDetail/" + event.courseId();
        String instructorName = event.instructorName() == null || event.instructorName().isBlank()
                ? "Giảng viên bạn theo dõi"
                : event.instructorName();
        String title = instructorName + " vừa ra khóa học mới";
        String content = "Khóa \"" + event.courseTitle() + "\" hiện đã được xuất bản.";
        Map<String, Object> metadata = Map.of(
                "courseId", event.courseId(),
                "instructorId", event.instructorId()
        );

        notificationService.createForAll(
                followers,
                NotificationType.INSTRUCTOR_NEW_COURSE,
                title,
                content,
                coursePath,
                metadata
        );

        List<EmailService.CourseReleaseRecipient> recipients = followers.stream()
                .map(follower -> new EmailService.CourseReleaseRecipient(follower.getEmail(), follower.getFullName()))
                .toList();
        emailService.sendNewInstructorCourseEmailsAsync(
                recipients,
                instructorName,
                event.courseTitle(),
                frontendBaseUrl + coursePath
        );
    }
}
