package com.example.back_end.instructor.adapter.in.web.dto;

import java.time.Instant;
import java.util.List;

public record TeacherStudentResponse(
        Long studentId,
        String fullName,
        String email,
        String phone,
        String avatar,
        List<TeacherStudentCourseResponse> courses,
        Instant enrolledAt,
        int progressPercent,
        String status
) {}
