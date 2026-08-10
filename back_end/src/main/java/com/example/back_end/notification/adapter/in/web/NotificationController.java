package com.example.back_end.notification.adapter.in.web;

import com.example.back_end.notification.adapter.in.web.dto.SelfNotificationRequest;
import com.example.back_end.notification.adapter.in.web.dto.NotificationResponse;
import com.example.back_end.notification.domain.enums.NotificationType;
import com.example.back_end.notification.application.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/learnova/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<Page<NotificationResponse>> listMine(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(notificationService.listMine(authentication.getName(), PageRequest.of(page, size)));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> unreadCount(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(notificationService.countUnread(authentication.getName()));
    }

    /** Persist an admin activity note into the current admin's notification bell. */
    @PostMapping("/self")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<NotificationResponse> createSelf(
            Authentication authentication,
            @Valid @RequestBody SelfNotificationRequest request
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(notificationService.createForEmail(
                authentication.getName(),
                NotificationType.GENERIC,
                request.title(),
                request.content(),
                request.link(),
                Map.of("source", "admin-ui")
        ));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable Long id, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        notificationService.markRead(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllRead(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        notificationService.markAllRead(authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
