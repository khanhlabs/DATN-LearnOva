package com.example.back_end.service;

import com.example.back_end.dto.response.NotificationResponse;
import com.example.back_end.entity.Notification;
import com.example.back_end.entity.User;
import com.example.back_end.entity.enums.NotificationType;
import com.example.back_end.exception.BusinessException;
import com.example.back_end.exception.ResourceNotFoundException;
import com.example.back_end.repository.NotificationRepository;
import com.example.back_end.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public void create(User user, NotificationType type, String title, String content, String link, Map<String, Object> metadata) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType(type);
        notification.setTitle(title);
        notification.setContent(content);
        notification.setLink(link);
        notification.setMetadata(metadata);
        notification.setIsRead(false);
        notification.setCreatedAt(Instant.now());
        notificationRepository.save(notification);
    }

    public NotificationResponse createForEmail(
            String email, NotificationType type, String title, String content, String link, Map<String, Object> metadata) {
        User user = userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType(type);
        notification.setTitle(title);
        notification.setContent(content);
        notification.setLink(link);
        notification.setMetadata(metadata);
        notification.setIsRead(false);
        notification.setCreatedAt(Instant.now());
        notificationRepository.saveAndFlush(notification);
        return toResponse(notification);
    }

    /**
     * Saves even if the caller transaction rolls back (e.g. money received but unlock failed).
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void createUrgent(
            User user, NotificationType type, String title, String content, String link, Map<String, Object> metadata) {
        create(user, type, title, content, link, metadata);
    }

    public void createForAll(List<User> users, NotificationType type, String title, String content, String link, Map<String, Object> metadata) {
        users.forEach(user -> create(user, type, title, content, link, metadata));
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> listMine(String email, Pageable pageable) {
        User user = userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return notificationRepository.findByUser_IdOrderByCreatedAtDesc(user.getId(), pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public long countUnread(String email) {
        User user = userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return notificationRepository.countByUser_IdAndIsReadFalse(user.getId());
    }

    public void markRead(Long id, String email) {
        User user = userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new BusinessException("You don't have permission to modify this notification");
        }

        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    public void markAllRead(String email) {
        User user = userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Notification> unread = notificationRepository
                .findByUser_IdOrderByCreatedAtDesc(user.getId(), Pageable.unpaged())
                .stream()
                .filter(n -> !Boolean.TRUE.equals(n.getIsRead()))
                .toList();

        unread.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(unread);
    }

    public int deleteReadOlderThan(int days) {
        Instant cutoff = Instant.now().minus(days, java.time.temporal.ChronoUnit.DAYS);
        return notificationRepository.deleteByIsReadTrueAndCreatedAtBefore(cutoff);
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType().name(),
                notification.getTitle(),
                notification.getContent(),
                notification.getIsRead(),
                notification.getLink(),
                notification.getCreatedAt()
        );
    }
}
