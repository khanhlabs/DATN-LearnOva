package com.example.back_end.support.application;

import com.example.back_end.auth.domain.User;
import com.example.back_end.auth.infrastructure.persistence.UserRepository;
import com.example.back_end.media.infrastructure.storage.S3Service;
import com.example.back_end.notification.application.NotificationService;
import com.example.back_end.notification.domain.enums.NotificationType;
import com.example.back_end.shared.exception.BusinessException;
import com.example.back_end.shared.exception.ResourceNotFoundException;
import com.example.back_end.support.adapter.in.web.dto.*;
import com.example.back_end.support.domain.SupportConversation;
import com.example.back_end.support.domain.SupportMessage;
import com.example.back_end.support.domain.enums.SupportConversationStatus;
import com.example.back_end.support.domain.enums.SupportMessageSenderType;
import com.example.back_end.support.infrastructure.persistence.SupportConversationRepository;
import com.example.back_end.support.infrastructure.persistence.SupportMessageRepository;
import com.example.back_end.support.infrastructure.realtime.SupportWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class SupportChatService {
    private final SupportConversationRepository conversationRepository;
    private final SupportMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final S3Service s3Service;
    private final NotificationService notificationService;
    private final SupportWebSocketHandler webSocketHandler;

    public SupportConversationResponse createConversation(String email, CreateSupportConversationRequest request) {
        User user = getUser(email);
        SupportConversation conversation = conversationRepository
                .findFirstByUser_IdAndStatusNotOrderByUpdatedAtDesc(user.getId(), SupportConversationStatus.CLOSED)
                .orElseGet(() -> {
                    SupportConversation created = new SupportConversation();
                    created.setUser(user);
                    created.setSubject(request.subject().trim());
                    created.setStatus(SupportConversationStatus.WAITING);
                    created.setCreatedAt(Instant.now());
                    created.setUpdatedAt(Instant.now());
                    return conversationRepository.save(created);
                });

        if (request.initialMessage() != null && !request.initialMessage().isBlank()) {
            SupportMessage initialMessage = saveMessage(
                    conversation, user, SupportMessageSenderType.USER,
                    request.initialMessage(), null, null, null
            );
            conversation.setUpdatedAt(Instant.now());
            conversationRepository.save(conversation);
            notifyParticipants(conversation, user, false, initialMessage);
        }
        return toConversationResponse(conversation, false);
    }

    @Transactional(readOnly = true)
    public Page<SupportConversationResponse> listMine(String email, Pageable pageable) {
        User user = getUser(email);
        return conversationRepository.findByUser_IdOrderByUpdatedAtDesc(user.getId(), pageable)
                .map(conversation -> toConversationResponse(conversation, false));
    }

    @Transactional(readOnly = true)
    public Page<SupportConversationResponse> listForAdmin(Pageable pageable) {
        return conversationRepository.findAllByOrderByUpdatedAtDesc(pageable)
                .map(conversation -> toConversationResponse(conversation, true));
    }

    @Transactional
    public List<SupportMessageResponse> listMessages(Long conversationId, String email, boolean admin) {
        SupportConversation conversation = getConversation(conversationId);
        ensureAccess(conversation, email, admin);
        if (admin) {
            conversation.setAdminReadAt(Instant.now());
            conversationRepository.save(conversation);
        }
        return messageRepository.findByConversation_IdOrderByCreatedAtAsc(conversationId)
                .stream().map(this::toMessageResponse).toList();
    }

    public SupportMessageResponse sendMessage(
            Long conversationId, String email, boolean admin, SendSupportMessageRequest request) {
        SupportConversation conversation = getConversation(conversationId);
        ensureAccess(conversation, email, admin);

        boolean hasText = request.content() != null && !request.content().isBlank();
        boolean hasAttachment = request.attachmentKey() != null && !request.attachmentKey().isBlank();
        if (!hasText && !hasAttachment) {
            throw new BusinessException("Tin nhắn không được để trống");
        }

        User sender = getUser(email);
        SupportMessage message = saveMessage(
                conversation,
                sender,
                admin ? SupportMessageSenderType.ADMIN : SupportMessageSenderType.USER,
                request.content(),
                request.attachmentKey(),
                request.attachmentName(),
                request.attachmentContentType()
        );

        conversation.setUpdatedAt(Instant.now());
        if (admin) {
            conversation.setAssignedAdmin(sender);
            conversation.setStatus(SupportConversationStatus.IN_PROGRESS);
        } else if (conversation.getStatus() == SupportConversationStatus.CLOSED) {
            conversation.setStatus(SupportConversationStatus.WAITING);
        }
        conversationRepository.save(conversation);
        notifyParticipants(conversation, sender, admin, message);
        return toMessageResponse(message);
    }

    private void notifyParticipants(
            SupportConversation conversation,
            User sender,
            boolean admin,
            SupportMessage message) {
        String preview = message.getContent() == null || message.getContent().isBlank()
                ? "Bạn có một tệp đính kèm mới."
                : message.getContent().trim();
        if (preview.length() > 120) {
            preview = preview.substring(0, 117) + "...";
        }
        final String messagePreview = preview;
        Map<String, Object> metadata = Map.of("conversationId", conversation.getId());
        Map<String, Object> realtimeEvent = Map.of(
                "type", "SUPPORT_MESSAGE",
                "conversationId", conversation.getId(),
                "message", toMessageResponse(message)
        );

        if (admin) {
            webSocketHandler.sendToUsers(List.of(conversation.getUser().getEmail()), realtimeEvent);
            if (!webSocketHandler.isConversationActive(conversation.getUser().getEmail(), conversation.getId())) {
                notificationService.create(
                        conversation.getUser(),
                        NotificationType.SUPPORT_MESSAGE,
                        "Nhân viên đã trả lời",
                        messagePreview,
                        "/learnova/home?supportConversationId=" + conversation.getId(),
                        metadata
                );
            }
            return;
        }

        List<User> activeAdmins = userRepository.findAllAdmins().stream()
                .filter(adminUser -> Boolean.TRUE.equals(adminUser.getIsActive()))
                .toList();
        webSocketHandler.sendToUsers(activeAdmins.stream().map(User::getEmail).toList(), realtimeEvent);
        activeAdmins.stream()
                .filter(adminUser -> !webSocketHandler.isConversationActive(adminUser.getEmail(), conversation.getId()))
                .forEach(adminUser -> notificationService.create(
                        adminUser,
                        NotificationType.SUPPORT_MESSAGE,
                        "Tin nhắn hỗ trợ mới",
                        (sender.getFullName() == null ? sender.getEmail() : sender.getFullName()) + ": " + messagePreview,
                        "/learnova/admin/support-chat?conversationId=" + conversation.getId(),
                        metadata
                ));
    }

    public SupportConversationResponse updateStatus(
            Long conversationId, String email, UpdateSupportConversationStatusRequest request) {
        SupportConversation conversation = getConversation(conversationId);
        User admin = getUser(email);
        conversation.setAssignedAdmin(admin);
        conversation.setStatus(request.status());
        conversation.setUpdatedAt(Instant.now());
        return toConversationResponse(conversationRepository.save(conversation), true);
    }

    private SupportMessage saveMessage(
            SupportConversation conversation,
            User sender,
            SupportMessageSenderType senderType,
            String content,
            String attachmentKey,
            String attachmentName,
            String attachmentContentType) {
        SupportMessage message = new SupportMessage();
        message.setConversation(conversation);
        message.setSender(sender);
        message.setSenderType(senderType);
        message.setContent(content == null ? null : content.trim());
        message.setAttachmentKey(attachmentKey);
        message.setAttachmentName(attachmentName);
        message.setAttachmentContentType(attachmentContentType);
        message.setCreatedAt(Instant.now());
        return messageRepository.save(message);
    }

    private User getUser(String email) {
        return userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private SupportConversation getConversation(Long id) {
        return conversationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Support conversation not found"));
    }

    private void ensureAccess(SupportConversation conversation, String email, boolean admin) {
        User user = getUser(email);
        if (!admin && !conversation.getUser().getId().equals(user.getId())) {
            throw new BusinessException("Bạn không có quyền truy cập cuộc hội thoại này");
        }
    }

    private SupportConversationResponse toConversationResponse(SupportConversation conversation, boolean adminView) {
        List<SupportMessage> messages = messageRepository.findByConversation_IdOrderByCreatedAtAsc(conversation.getId());
        SupportMessage last = messages.isEmpty() ? null : messages.get(messages.size() - 1);
        return new SupportConversationResponse(
                conversation.getId(),
                conversation.getUser().getId(),
                conversation.getUser().getFullName(),
                conversation.getUser().getEmail(),
                conversation.getAssignedAdmin() == null ? null : conversation.getAssignedAdmin().getId(),
                conversation.getSubject(),
                conversation.getStatus(),
                conversation.getCreatedAt(),
                conversation.getUpdatedAt(),
                last == null ? null : toMessageResponse(last),
                adminView && last != null
                        && last.getSenderType() == SupportMessageSenderType.USER
                        && (conversation.getAdminReadAt() == null
                        || last.getCreatedAt().isAfter(conversation.getAdminReadAt()))
        );
    }

    private SupportMessageResponse toMessageResponse(SupportMessage message) {
        String attachmentUrl = null;
        if (message.getAttachmentKey() != null && !message.getAttachmentKey().isBlank()) {
            attachmentUrl = s3Service.generateCloudFrontSignedUrl(message.getAttachmentKey());
        }
        return new SupportMessageResponse(
                message.getId(),
                message.getConversation().getId(),
                message.getSender().getId(),
                message.getSender().getFullName(),
                message.getSenderType(),
                message.getContent(),
                attachmentUrl,
                message.getAttachmentName(),
                message.getAttachmentContentType(),
                message.getCreatedAt()
        );
    }
}
