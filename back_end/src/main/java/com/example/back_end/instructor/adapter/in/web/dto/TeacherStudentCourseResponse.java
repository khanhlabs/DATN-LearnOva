package com.example.back_end.instructor.adapter.in.web.dto;

import java.time.Instant;

public record TeacherStudentCourseResponse(
        Long courseId,
        String courseTitle,
        int progressPercent,
        Instant enrolledAt
) {}
