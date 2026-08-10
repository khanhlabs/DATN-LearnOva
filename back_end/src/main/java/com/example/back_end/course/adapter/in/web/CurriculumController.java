package com.example.back_end.course.adapter.in.web;

import com.example.back_end.course.adapter.in.web.dto.CourseCurriculumResponse;
import com.example.back_end.course.application.CourseCurriculumService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import com.example.back_end.assessment.application.ReviewService;
import com.example.back_end.assessment.adapter.in.web.dto.CourseReviewResponse;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/learnova/student/courses")
public class CurriculumController {

    private final CourseCurriculumService courseCurriculumService;
    private final ReviewService reviewService;

    @GetMapping("/{courseId}/curriculum")
    public CourseCurriculumResponse getCourseCurriculum(
            @PathVariable Long courseId
    ) {
        return courseCurriculumService.getCourseCurriculum(courseId);
    }
    @GetMapping("/{courseId}/reviews")
    public CourseReviewResponse getCourseReviews(
            @PathVariable Long courseId
    ) {
        return reviewService.getCourseReviewSummary(courseId);
    }
}