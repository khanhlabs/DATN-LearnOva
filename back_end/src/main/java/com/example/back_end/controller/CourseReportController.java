package com.example.back_end.controller;

import com.example.back_end.dto.request.CreateCourseReportRequest;
import com.example.back_end.dto.response.CourseReportResponse;
import com.example.back_end.security.CustomUserDetails;
import com.example.back_end.service.CourseReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/learnova/reports")
public class CourseReportController {

    private final CourseReportService courseReportService;

    @PostMapping
    public ResponseEntity<CourseReportResponse> create(
            Authentication authentication,
            @Valid @RequestBody CreateCourseReportRequest request
    ) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        CourseReportResponse response = courseReportService.create(userDetails.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
