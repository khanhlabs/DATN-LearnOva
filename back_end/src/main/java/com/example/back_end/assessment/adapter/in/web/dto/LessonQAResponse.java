package com.example.back_end.assessment.adapter.in.web.dto;

import lombok.Data;

import java.util.List;

@Data
public class LessonQAResponse {
    private Long lessonId;
    private String lessonTitle;

    private List<QuestionResponse> questions;
}