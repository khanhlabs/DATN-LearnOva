package com.example.back_end.ai.adapter.in.web;

import com.example.back_end.ai.adapter.in.web.dto.AiGenerationJobStatusResponse;
import com.example.back_end.ai.application.AiGenerationQueueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/learnova/lessons")
@RequiredArgsConstructor
public class AiGenerationController {
    private final AiGenerationQueueService queueService;

    @GetMapping("/{lessonId}/ai-generation-status")
    public ResponseEntity<List<AiGenerationJobStatusResponse>> getStatus(@PathVariable Long lessonId) {
        return ResponseEntity.ok(queueService.getStatus(lessonId));
    }
}
