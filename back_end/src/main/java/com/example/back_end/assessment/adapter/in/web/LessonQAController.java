package com.example.back_end.assessment.adapter.in.web;
import com.example.back_end.course.domain.Course;

import com.example.back_end.assessment.adapter.in.web.dto.CreateAnswerRequest;
import com.example.back_end.assessment.adapter.in.web.dto.CreateQuestionRequest;
import com.example.back_end.assessment.adapter.in.web.dto.LessonQAResponse;
import com.example.back_end.instructor.adapter.in.web.dto.TeacherQuestionResponse;
import com.example.back_end.security.CustomUserDetails;
import com.example.back_end.assessment.application.LessonQAService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/learnova/qna")
@RequiredArgsConstructor
public class LessonQAController {

    private final LessonQAService qaService;

    @GetMapping("/course/{courseId}")
    public LessonQAResponse getCourseQnA(@PathVariable Long courseId) {
        return qaService.getCourseQnA(courseId);
    }

    @GetMapping("/lesson/{lessonId}")
    public LessonQAResponse getLessonQnA(@PathVariable Long lessonId) {
        return qaService.getLessonQnA(lessonId);
    }

    @PostMapping("/question")
    public void createQuestion(
            Authentication auth,
            @Valid @RequestBody CreateQuestionRequest req
    ) {
        CustomUserDetails user = (CustomUserDetails) auth.getPrincipal();
        qaService.createQuestion(user.getId(), req);
    }

    @PostMapping("/answer")
    public void createAnswer(
            Authentication auth,
            @Valid @RequestBody CreateAnswerRequest req
    ) {
        CustomUserDetails user = (CustomUserDetails) auth.getPrincipal();
        qaService.createAnswer(user.getId(), req);
    }

    @DeleteMapping("/answer/{answerId}")
    public void deleteAnswer(
            Authentication auth,
            @PathVariable Long answerId
    ) {
        CustomUserDetails user = (CustomUserDetails) auth.getPrincipal();
        qaService.deleteAnswer(user.getId(), answerId);
    }

    @DeleteMapping("/question/{questionId}")
    public void deleteQuestion(
            Authentication auth,
            @PathVariable Long questionId
    ) {
        CustomUserDetails user = (CustomUserDetails) auth.getPrincipal();
        qaService.deleteQuestion(user.getId(), questionId);
    }

    @PutMapping("/answer/{id}")
    public void updateAnswer(
            Authentication auth,
            @PathVariable Long id,
            @Valid @RequestBody CreateAnswerRequest req
    ) {
        CustomUserDetails user = (CustomUserDetails) auth.getPrincipal();
        qaService.updateAnswer(user.getId(), id, req);
    }

    @PutMapping("/question/{id}")
    public void updateQuestion(
            Authentication auth,
            @PathVariable Long id,
            @Valid @RequestBody CreateQuestionRequest req
    ) {
        CustomUserDetails user = (CustomUserDetails) auth.getPrincipal();
        qaService.updateQuestion(user.getId(), id, req);
    }

    /** Question owner or the course instructor only. */
    @PatchMapping("/question/{id}/solved")
    public void setSolved(
            Authentication auth,
            @PathVariable Long id,
            @RequestParam(defaultValue = "true") boolean value
    ) {
        CustomUserDetails user = (CustomUserDetails) auth.getPrincipal();
        qaService.setSolved(user.getId(), id, value);
    }

    /** Course instructor only. */
    @PatchMapping("/question/{id}/pinned")
    public void setPinned(
            Authentication auth,
            @PathVariable Long id,
            @RequestParam(defaultValue = "true") boolean value
    ) {
        CustomUserDetails user = (CustomUserDetails) auth.getPrincipal();
        qaService.setPinned(user.getId(), id, value);
    }

    /** Teacher Q&A inbox: all questions across every course this instructor teaches. */
    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/my-questions")
    public ResponseEntity<List<TeacherQuestionResponse>> getMyQuestions(Authentication auth) {
        return ResponseEntity.ok(qaService.getMyQuestions(auth.getName()));
    }
}
