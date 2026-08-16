package com.example.back_end.support.infrastructure.realtime;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Collection;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SupportWebSocketHandler extends TextWebSocketHandler {
    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
    private final Map<String, Set<WebSocketSession>> sessionsByEmail = new ConcurrentHashMap<>();
    private final Map<String, Long> activeConversationBySession = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String email = emailOf(session);
        if (email == null) {
            closeQuietly(session, CloseStatus.NOT_ACCEPTABLE);
            return;
        }
        sessionsByEmail.computeIfAbsent(email, ignored -> ConcurrentHashMap.newKeySet()).add(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        activeConversationBySession.remove(session.getId());
        String email = emailOf(session);
        if (email == null) return;
        Set<WebSocketSession> sessions = sessionsByEmail.get(email);
        if (sessions == null) return;
        sessions.remove(session);
        if (sessions.isEmpty()) sessionsByEmail.remove(email);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        try {
            Map<?, ?> payload = objectMapper.readValue(message.getPayload(), Map.class);
            if (!"SUPPORT_CONVERSATION_ACTIVE".equals(payload.get("type"))) return;
            Object conversationId = payload.get("conversationId");
            if (conversationId == null || String.valueOf(conversationId).isBlank()) {
                activeConversationBySession.remove(session.getId());
            } else {
                activeConversationBySession.put(session.getId(), Long.valueOf(String.valueOf(conversationId)));
            }
        } catch (Exception ignored) {
            // Ignore malformed client state messages.
        }
    }

    public boolean isConversationActive(String email, Long conversationId) {
        Set<WebSocketSession> sessions = sessionsByEmail.get(email);
        if (sessions == null) return false;
        return sessions.stream()
                .filter(WebSocketSession::isOpen)
                .map(session -> activeConversationBySession.get(session.getId()))
                .anyMatch(conversationId::equals);
    }

    public void sendToUsers(Collection<String> emails, Object event) {
        final String payload;
        try {
            payload = objectMapper.writeValueAsString(event);
        } catch (Exception exception) {
            return;
        }

        emails.forEach(email -> {
            Set<WebSocketSession> sessions = sessionsByEmail.get(email);
            if (sessions == null) return;
            sessions.removeIf(session -> !session.isOpen());
            sessions.forEach(session -> {
                try {
                    synchronized (session) {
                        session.sendMessage(new TextMessage(payload));
                    }
                } catch (Exception exception) {
                    closeQuietly(session, CloseStatus.SERVER_ERROR);
                }
            });
        });
    }

    private String emailOf(WebSocketSession session) {
        Object email = session.getAttributes().get(SupportWebSocketHandshakeInterceptor.EMAIL_ATTRIBUTE);
        return email == null ? null : email.toString();
    }

    private void closeQuietly(WebSocketSession session, CloseStatus status) {
        try {
            session.close(status);
        } catch (Exception ignored) {
            // Connection is already closed.
        }
    }
}
