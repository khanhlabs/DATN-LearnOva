package com.example.back_end.course.adapter.in.web;

import com.example.back_end.course.adapter.in.web.dto.CategoryOptionResponse;
import com.example.back_end.course.adapter.in.web.dto.CourseDetailResponse;
import com.example.back_end.course.adapter.in.web.dto.FeaturedCourseResponse;
import com.example.back_end.media.adapter.in.web.dto.GetFileUrlResponse;
import com.example.back_end.course.adapter.in.web.dto.PublicCourseResponse;
import com.example.back_end.course.adapter.in.web.dto.TopCategoryResponse;
import com.example.back_end.course.application.CourseService;
import com.example.back_end.media.infrastructure.storage.S3Service;
import com.example.back_end.admin.application.AdminCategoryService;
import com.example.back_end.course.adapter.in.web.dto.VoiceCourseSearchRequest;
import com.example.back_end.course.adapter.in.web.dto.VoiceCourseSearchResponse;
import com.example.back_end.course.application.VoiceCourseSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import org.springframework.http.ResponseEntity;

import java.util.List;

@RestController
@RequestMapping("/api/learnova/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;
    private final S3Service s3Service;
    private final AdminCategoryService categoryService;
    private final VoiceCourseSearchService voiceCourseSearchService;

    @GetMapping("/video-url")
    public GetFileUrlResponse getVideoUrl(
            @RequestParam String fileKey
    ) {
        String hlsMasterPath = courseService.getHlsMasterPlaylistPathIfReady(fileKey);
        String url = hlsMasterPath != null
                ? ServletUriComponentsBuilder.fromCurrentContextPath().path(hlsMasterPath).toUriString()
                : s3Service.generateCloudFrontSignedUrl(fileKey);

        return new GetFileUrlResponse(url);
    }

    @GetMapping("/categories")
    public List<CategoryOptionResponse> getActiveCategories() {
        return categoryService.getActiveCategories();
    }

    @GetMapping("/featured")
    public ResponseEntity<List<FeaturedCourseResponse>> getFeaturedCourses() {
        return ResponseEntity.ok(courseService.getFeaturedCourses());
    }

    @GetMapping("/stats")
    public ResponseEntity<com.example.back_end.course.adapter.in.web.dto.PlatformStatsResponse> getPlatformStats() {
        return ResponseEntity.ok(courseService.getPlatformStats());
    }

    @GetMapping("/top-categories")
    public ResponseEntity<List<TopCategoryResponse>> getTopCategories() {
        return ResponseEntity.ok(courseService.getTopCategories());
    }

    @GetMapping("/{courseId}")
    public ResponseEntity<CourseDetailResponse> getCourseDetail(@PathVariable Long courseId) {
        return ResponseEntity.ok(courseService.getCourseDetail(courseId));
    }

    @GetMapping("/public")
    public List<PublicCourseResponse> getPublishedCourses() {
        return courseService.getPublishedCourses();
    }

    @PostMapping("/voice-search")
    public VoiceCourseSearchResponse voiceSearch(@RequestBody @jakarta.validation.Valid VoiceCourseSearchRequest request) {
        return voiceCourseSearchService.search(request);
    }

    @GetMapping("/public/{courseId}")
    public PublicCourseResponse getPublishedCourse(@PathVariable Long courseId) {
        return courseService.getPublishedCourse(courseId);
    }

}
