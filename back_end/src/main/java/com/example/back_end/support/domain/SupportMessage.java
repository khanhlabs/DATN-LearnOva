package com.example.back_end.support.domain;

import com.example.back_end.auth.domain.User;
import com.example.back_end.support.domain.enums.SupportMessageSenderType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "support_messages")
public class SupportMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "message_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id", nullable = false)
    private SupportConversation conversation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Enumerated(EnumType.STRING)
    @Column(name = "sender_type", nullable = false, length = 20)
    private SupportMessageSenderType senderType;

    @Column(columnDefinition = "text")
    private String content;

    @Column(name = "attachment_key")
    private String attachmentKey;

    @Column(name = "attachment_name")
    private String attachmentName;

    @Column(name = "attachment_content_type", length = 100)
    private String attachmentContentType;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
