package com.example.back_end.assessment.adapter.in.web;

import com.example.back_end.assessment.adapter.in.web.dto.SubmitQuizRequest;
import com.example.back_end.assessment.adapter.in.web.dto.QuizResponse;
import com.example.back_end.assessment.adapter.in.web.dto.QuizResultResponse;
import com.example.back_end.security.CustomUserDetails;
import com.example.back_end.assessment.application.QuizService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/learnova/lessons")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;

    @GetMapping("/{lessonId}/quiz")
    public ResponseEntity<QuizResponse> getQuiz(@PathVariable Long lessonId) {
        return ResponseEntity.ok(quizService.getQuiz(lessonId));
    }

    @PostMapping("/{lessonId}/quiz")
    public ResponseEntity<QuizResponse> generateQuiz(@PathVariable Long lessonId) {
        return ResponseEntity.ok(quizService.generateQuiz(lessonId));
    }

    @PostMapping("/{lessonId}/quiz/submit")
    public ResponseEntity<QuizResultResponse> submitQuiz(
            Authentication authentication,
            @PathVariable Long lessonId,
            @Valid @RequestBody SubmitQuizRequest request
    ) {
        CustomUserDetails user = (CustomUserDetails) authentication.getPrincipal();
        return ResponseEntity.ok(quizService.submitQuiz(lessonId, user.getId(), request));
    }
}
