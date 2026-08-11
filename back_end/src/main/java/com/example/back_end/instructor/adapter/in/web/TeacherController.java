package com.example.back_end.instructor.adapter.in.web;

import com.example.back_end.instructor.adapter.in.web.dto.PublicInstructorDetailResponse;
import com.example.back_end.instructor.adapter.in.web.dto.PublicInstructorProfileResponse;
import com.example.back_end.instructor.adapter.in.web.dto.PublicInstructorResponse;
import com.example.back_end.instructor.adapter.in.web.dto.PublicInstructorSummaryResponse;
import com.example.back_end.instructor.application.PublicInstructorService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/learnova/instructors")
public class TeacherController {

    private final PublicInstructorService publicInstructorService;

    @GetMapping
    public List<PublicInstructorSummaryResponse> listInstructors() {
        return publicInstructorService.listInstructors();
    }

    @GetMapping("/{instructorId}")
    public PublicInstructorProfileResponse getInstructorProfile(@PathVariable Long instructorId) {
        return publicInstructorService.getInstructorProfile(instructorId);
    }

    @GetMapping("/public")
    public List<PublicInstructorResponse> getPublicInstructors() {
        return publicInstructorService.getPublicInstructors();
    }

    @GetMapping("/public/{instructorId}")
    public PublicInstructorDetailResponse getPublicInstructorDetail(@PathVariable Long instructorId) {
        return publicInstructorService.getPublicInstructorDetail(instructorId);
    }
}
