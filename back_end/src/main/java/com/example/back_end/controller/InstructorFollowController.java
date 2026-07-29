package com.example.back_end.controller;

import com.example.back_end.dto.response.FollowStatusResponse;
import com.example.back_end.service.InstructorFollowService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/learnova/instructors/{instructorId}/follow")
public class InstructorFollowController {

    private final InstructorFollowService instructorFollowService;

    @PostMapping
    public ResponseEntity<FollowStatusResponse> follow(
            @PathVariable Long instructorId,
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(instructorFollowService.follow(instructorId, authentication.getName()));
    }

    @DeleteMapping
    public ResponseEntity<FollowStatusResponse> unfollow(
            @PathVariable Long instructorId,
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(instructorFollowService.unfollow(instructorId, authentication.getName()));
    }

    @GetMapping
    public ResponseEntity<FollowStatusResponse> status(
            @PathVariable Long instructorId,
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(instructorFollowService.getStatus(instructorId, authentication.getName()));
    }
}
