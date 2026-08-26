package com.example.back_end.notification.infrastructure.persistence;

import com.example.back_end.notification.domain.Notification;
import com.example.back_end.notification.domain.enums.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByUser_IdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    long countByUser_IdAndIsReadFalse(Long userId);

    @Modifying
    @Query(value = "UPDATE notifications SET is_read = TRUE "
            + "WHERE user_id = :userId AND type = 'SUPPORT_MESSAGE' AND is_read = FALSE "
            + "AND metadata ->> 'conversationId' = CAST(:conversationId AS text)", nativeQuery = true)
    int markSupportConversationRead(@Param("userId") Long userId, @Param("conversationId") Long conversationId);

    @Modifying
    @Query(value = "DELETE FROM notifications "
            + "WHERE user_id = :userId AND type = 'SUPPORT_MESSAGE' "
            + "AND metadata ->> 'conversationId' = CAST(:conversationId AS text)", nativeQuery = true)
    int deleteSupportConversationNotifications(@Param("userId") Long userId, @Param("conversationId") Long conversationId);

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.user.id = :userId")
    int deleteAllByUserId(@Param("userId") Long userId);

    List<Notification> findByTypeOrderByCreatedAtDesc(NotificationType type);

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.isRead = true AND n.createdAt < :cutoff")
    int deleteByIsReadTrueAndCreatedAtBefore(@Param("cutoff") Instant cutoff);
}
