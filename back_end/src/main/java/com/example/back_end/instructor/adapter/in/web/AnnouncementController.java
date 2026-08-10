package com.example.back_end.instructor.adapter.in.web;

import com.example.back_end.instructor.adapter.in.web.dto.CreateAnnouncementRequest;
import com.example.back_end.instructor.adapter.in.web.dto.AnnouncementResponse;
import com.example.back_end.instructor.application.AnnouncementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/learnova/teacher/announcements")
@RequiredArgsConstructor
@PreAuthorize("hasRole('TEACHER')")
public class AnnouncementController {

    private final AnnouncementService announcementService;

    @GetMapping
    public Page<AnnouncementResponse> getMyAnnouncements(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication
    ) {
        return announcementService.getMyAnnouncements(authentication.getName(), PageRequest.of(page, size));
    }

    @PostMapping
    public AnnouncementResponse createAnnouncement(
            @Valid @RequestBody CreateAnnouncementRequest request,
            Authentication authentication
    ) {
        return announcementService.createAnnouncement(request, authentication.getName());
    }
}
