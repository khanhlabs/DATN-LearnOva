package com.example.back_end.support.infrastructure.persistence;

import com.example.back_end.support.domain.SupportConversation;
import com.example.back_end.support.domain.enums.SupportConversationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SupportConversationRepository extends JpaRepository<SupportConversation, Long> {
    Page<SupportConversation> findAllByOrderByUpdatedAtDesc(Pageable pageable);
    Page<SupportConversation> findByUser_IdOrderByUpdatedAtDesc(Long userId, Pageable pageable);
    Optional<SupportConversation> findFirstByUser_IdAndStatusNotOrderByUpdatedAtDesc(Long userId, SupportConversationStatus status);
}
