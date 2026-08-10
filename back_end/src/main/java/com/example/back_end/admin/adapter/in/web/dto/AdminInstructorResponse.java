package com.example.back_end.admin.adapter.in.web.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

import com.example.back_end.user.domain.enums.GenderType;

public record AdminInstructorResponse(
    Long instructorId,
    String instructorCode,
    String fullName,
    String email,
    String avatar,
    String coverImage,
    String phone,
    LocalDate dateOfBirth,
    GenderType gender,
    Boolean isActive,
    Boolean isDeleted,
    Instant createdAt,
    Instant updatedAt,
    String specialization,
    Long numberOfClasses,
    Long totalStudents,
    BigDecimal totalRevenue,
    List<CourseSummary> courses
) {
    public record CourseSummary(
        Long id,
        String title,
        String thumbnailKey,
        String category,
        Long students,
        Double rating,
        BigDecimal price,
        BigDecimal revenue,
        String status,
        OffsetDateTime publishedAt
    ) {}
}
