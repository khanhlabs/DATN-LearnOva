package com.example.back_end.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.back_end.dto.response.ContinueLearningResponse;
import com.example.back_end.dto.response.MyEnrolledCourseResponse;
import com.example.back_end.repository.EnrollmentRepository;
import com.example.back_end.service.EnrollmentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/learnova/enrollments")
public class EnrollmentController {

    private final EnrollmentRepository enrollmentRepository;
    private final EnrollmentService enrollmentService;

    // Check user đã mua / đã enroll khóa học chưa
    @GetMapping("/check")
    public ResponseEntity<Map<String, Boolean>> checkEnrollment(
            @RequestParam Long courseId,
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.ok(Map.of("enrolled", false));
        }

        boolean enrolled = enrollmentRepository.existsByUserEmailAndCourseId(
                authentication.getName(),
                courseId
        );

        return ResponseEntity.ok(Map.of("enrolled", enrolled));
    }

    // Lấy danh sách khóa học của user đang đăng nhập
    @GetMapping("/my-courses")
    public ResponseEntity<List<MyEnrolledCourseResponse>> getMyEnrolledCourses() {
        return ResponseEntity.ok(enrollmentService.getMyEnrolledCourses());
    }

    // Khóa học nên "học tiếp" trên trang chủ (dựa vào hoạt động xem bài học gần nhất)
    @GetMapping("/continue-learning")
    public ResponseEntity<ContinueLearningResponse> getContinueLearning() {
        ContinueLearningResponse response = enrollmentService.getContinueLearning();
        return response != null ? ResponseEntity.ok(response) : ResponseEntity.noContent().build();
    }
}