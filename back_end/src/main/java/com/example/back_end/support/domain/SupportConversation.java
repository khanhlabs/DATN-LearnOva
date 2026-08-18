package com.example.back_end.support.domain;

import com.example.back_end.auth.domain.User;
import com.example.back_end.support.domain.enums.SupportConversationStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "support_conversations")
public class SupportConversation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "conversation_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_admin_id")
    private User assignedAdmin;

    @Column(nullable = false, length = 200)
    private String subject;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SupportConversationStatus status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "admin_read_at")
    private Instant adminReadAt;
}
