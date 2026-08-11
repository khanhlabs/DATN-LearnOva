package com.example.back_end.admin.adapter.in.web;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.back_end.admin.adapter.in.web.dto.RejectCourseRequest;
import com.example.back_end.admin.adapter.in.web.dto.AdminCourseDetailResponse;
import com.example.back_end.admin.adapter.in.web.dto.AdminCourseResponse;
import com.example.back_end.media.adapter.in.web.dto.GetFileUrlResponse;
import com.example.back_end.admin.application.AdminCourseService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/learnova/admin/courses-management")
public class AdminCourseController {

    private final AdminCourseService adminCourseService;

    @GetMapping
    public ResponseEntity<List<AdminCourseResponse>> listAll() {
        return ResponseEntity.ok(adminCourseService.getAllCourses());
    }

    @GetMapping("/thumbnail-url")
    public ResponseEntity<GetFileUrlResponse> getThumbnailUrl(
            @RequestParam String thumbnailKey
    ) {
        String signedUrl = adminCourseService.getThumbnailUrl(thumbnailKey);
        return ResponseEntity.ok(new GetFileUrlResponse(signedUrl));
    }


    @GetMapping("/{id}/detail")
    public ResponseEntity<AdminCourseDetailResponse> getDetail(@PathVariable Long id) {
        return ResponseEntity.ok(adminCourseService.getCourseDetail(id));
    }


    @PatchMapping("/{id}/approve")
    public ResponseEntity<AdminCourseDetailResponse> approve(@PathVariable Long id) {
        return ResponseEntity.ok(adminCourseService.approveCourse(id));
    }


    @PatchMapping("/{id}/reject")
    public ResponseEntity<AdminCourseDetailResponse> reject(
            @PathVariable Long id,
            @Valid @RequestBody RejectCourseRequest request
    ) {
        return ResponseEntity.ok(adminCourseService.rejectCourse(id, request.reason()));
    }
}
