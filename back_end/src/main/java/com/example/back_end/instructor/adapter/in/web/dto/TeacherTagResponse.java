package com.example.back_end.instructor.adapter.in.web.dto;

import java.time.Instant;

public record TeacherTagResponse(
    Long id,
    String name,
    String slug,
    Long courseId,
    String courseTitle,
    Boolean isDeleted,
    Instant updatedAt
) {}
