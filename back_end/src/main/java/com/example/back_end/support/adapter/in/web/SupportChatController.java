package com.example.back_end.support.adapter.in.web;

import com.example.back_end.support.adapter.in.web.dto.*;
import com.example.back_end.support.application.SupportChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/learnova/support")
public class SupportChatController {
    private final SupportChatService supportChatService;

    @GetMapping("/conversations")
    public Page<SupportConversationResponse> myConversations(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return supportChatService.listMine(authentication.getName(), PageRequest.of(page, size));
    }

    @PostMapping("/conversations")
    public SupportConversationResponse createConversation(
            Authentication authentication,
            @Valid @RequestBody CreateSupportConversationRequest request) {
        return supportChatService.createConversation(authentication.getName(), request);
    }

    @GetMapping("/conversations/{id}/messages")
    public List<SupportMessageResponse> myMessages(Authentication authentication, @PathVariable Long id) {
        return supportChatService.listMessages(id, authentication.getName(), false);
    }

    @PostMapping("/conversations/{id}/messages")
    public SupportMessageResponse sendUserMessage(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody SendSupportMessageRequest request) {
        return supportChatService.sendMessage(id, authentication.getName(), false, request);
    }

    @GetMapping("/admin/conversations")
    public Page<SupportConversationResponse> adminConversations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return supportChatService.listForAdmin(PageRequest.of(page, size));
    }

    @GetMapping("/admin/conversations/{id}/messages")
    public List<SupportMessageResponse> adminMessages(Authentication authentication, @PathVariable Long id) {
        return supportChatService.listMessages(id, authentication.getName(), true);
    }

    @PostMapping("/admin/conversations/{id}/messages")
    public SupportMessageResponse sendAdminMessage(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody SendSupportMessageRequest request) {
        return supportChatService.sendMessage(id, authentication.getName(), true, request);
    }

    @PatchMapping("/admin/conversations/{id}/status")
    public SupportConversationResponse updateStatus(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody UpdateSupportConversationStatusRequest request) {
        return supportChatService.updateStatus(id, authentication.getName(), request);
    }
}
