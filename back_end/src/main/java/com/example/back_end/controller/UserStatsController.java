package com.example.back_end.controller;

import com.example.back_end.dto.response.UserStatsResponse;
import com.example.back_end.service.UserStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/learnova/user")
public class UserStatsController {

    private final UserStatsService userStatsService;

    @GetMapping("/stats")
    public ResponseEntity<UserStatsResponse> getMyStats() {
        return ResponseEntity.ok(userStatsService.getMyStats());
    }
}
