package com.example.back_end.controller.admin;

import com.example.back_end.dto.response.admin.AdminRevenueComparisonResponse;
import com.example.back_end.dto.response.admin.AdminRevenueCourseRankingResponse;
import com.example.back_end.dto.response.admin.AdminRevenueInstructorRankingResponse;
import com.example.back_end.dto.response.admin.AdminRevenueOverviewResponse;
import com.example.back_end.dto.response.admin.AdminRevenueTransactionInsightsResponse;
import com.example.back_end.dto.response.admin.AdminRevenueTransactionResponse;
import com.example.back_end.service.admin.AdminRevenueService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/learnova/admin/revenue")
public class AdminRevenueController {

    private final AdminRevenueService adminRevenueService;

    @GetMapping("/overview")
    public ResponseEntity<AdminRevenueOverviewResponse> getOverview() {
        return ResponseEntity.ok(adminRevenueService.getOverview());
    }

    @GetMapping("/comparison")
    public ResponseEntity<AdminRevenueComparisonResponse> getComparison(
            @RequestParam(defaultValue = "month") String range
    ) {
        return ResponseEntity.ok(adminRevenueService.getComparison(range));
    }

    @GetMapping("/top-courses")
    public ResponseEntity<Page<AdminRevenueCourseRankingResponse>> getTopRevenueCourses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size
    ) {
        return ResponseEntity.ok(adminRevenueService.getTopRevenueCourses(toPageable(page, size)));
    }

    @GetMapping("/top-instructors")
    public ResponseEntity<Page<AdminRevenueInstructorRankingResponse>> getTopEarningInstructors(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size
    ) {
        return ResponseEntity.ok(adminRevenueService.getTopEarningInstructors(toPageable(page, size)));
    }

    @GetMapping("/transactions")
    public ResponseEntity<Page<AdminRevenueTransactionResponse>> getTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok(adminRevenueService.getTransactions(
                search,
                categoryId,
                paymentMethod,
                status,
                toPageable(page, size)
        ));
    }

    @GetMapping("/transaction-insights")
    public ResponseEntity<AdminRevenueTransactionInsightsResponse> getTransactionInsights() {
        return ResponseEntity.ok(adminRevenueService.getTransactionInsights());
    }

    private Pageable toPageable(int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 50);
        return PageRequest.of(safePage, safeSize, Sort.unsorted());
    }
}
