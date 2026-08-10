package com.example.back_end.learning.adapter.in.web.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LessonProgressRequest {
    @NotNull
    private Long lessonId;

    @NotNull
    private Integer watchedSeconds;
}
