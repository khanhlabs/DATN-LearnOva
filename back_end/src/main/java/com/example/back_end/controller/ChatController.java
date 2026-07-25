package com.example.back_end.controller;

import com.example.back_end.dto.request.ChatRequest;
import com.example.back_end.dto.response.ChatResponse;
import com.example.back_end.service.GroqChatService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/learnova/chatbot")
public class ChatController {

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

    private String resolveClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
