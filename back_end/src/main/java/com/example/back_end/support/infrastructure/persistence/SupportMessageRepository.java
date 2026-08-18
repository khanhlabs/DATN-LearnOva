package com.example.back_end.support.infrastructure.persistence;

import com.example.back_end.support.domain.SupportMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SupportMessageRepository extends JpaRepository<SupportMessage, Long> {
    List<SupportMessage> findByConversation_IdOrderByCreatedAtAsc(Long conversationId);
}
