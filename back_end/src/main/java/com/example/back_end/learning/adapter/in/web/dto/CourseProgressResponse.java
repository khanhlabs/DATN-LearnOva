package com.example.back_end.learning.adapter.in.web.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseProgressResponse {
    private Long courseId;
    private long completedLessonsCount;
    private long totalLessonsCount;
    private double courseProgressPercent;
    
    @JsonProperty("isCourseCompleted")
    private boolean isCourseCompleted;

    @JsonProperty("isCourseCompleted")
    public boolean isCourseCompleted() {
        return this.isCourseCompleted;
    }
    
    private List<LessonProgressResponse> lessonProgresses;
}
