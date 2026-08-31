package com.example.back_end.learning.adapter.in.web;

import com.example.back_end.learning.adapter.in.web.dto.LessonSummaryResponse;
import com.example.back_end.learning.application.LessonSummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/learnova/lessons")
@RequiredArgsConstructor
public class SummaryController {

    private final LessonSummaryService lessonSummaryService;

    @GetMapping("/{lessonId}/summary")
    public ResponseEntity<LessonSummaryResponse> getSummary(@PathVariable Long lessonId) {
        return ResponseEntity.ok(lessonSummaryService.getSummary(lessonId));
    }

}
