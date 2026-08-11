package com.example.back_end.instructor.adapter.in.web.dto;

public record PublicInstructorSummaryResponse(
        Long instructorId,
        String fullName,
        String avatar,
        String avatarKey,
        String headline,
        String expertise,
        long courseCount,
        long studentCount,
        double avgRating,
        long ratingCount
) {}
