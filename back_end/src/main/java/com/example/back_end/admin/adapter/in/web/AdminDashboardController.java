package com.example.back_end.admin.adapter.in.web;

import com.example.back_end.admin.adapter.in.web.dto.AdminDashboardResponse;
import com.example.back_end.admin.application.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/learnova/admin/dashboard")
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    @GetMapping
    public ResponseEntity<AdminDashboardResponse> getDashboard(
            @RequestParam(required = false) Integer year
    ) {
        return ResponseEntity.ok(adminDashboardService.getDashboard(year));
    }
}
