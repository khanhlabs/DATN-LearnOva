package com.example.back_end.ai.adapter.in.web;

import com.example.back_end.ai.adapter.in.web.dto.ChatRequest;
import com.example.back_end.ai.adapter.in.web.dto.ChatResponse;
import com.example.back_end.ai.infrastructure.GroqChatService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/learnova/chatbot")
public class ChatBotController {

    private final GroqChatService groqChatService;

    @PostMapping("/message")
    public ChatResponse sendMessage(
            @Valid @RequestBody ChatRequest request,
            HttpServletRequest servletRequest
    ) {
        String reply = groqChatService.chat(
                request.getMessages(),
                resolveClientIp(servletRequest)
        );

        return new ChatResponse(reply);
    }

    @PostMapping(value = "/message/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamMessage(
            @Valid @RequestBody ChatRequest request,
            HttpServletRequest servletRequest
    ) {
        return groqChatService.streamChat(
                request.getMessages(),
                resolveClientIp(servletRequest)
        );
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
