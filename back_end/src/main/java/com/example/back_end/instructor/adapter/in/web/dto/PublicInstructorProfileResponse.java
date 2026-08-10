package com.example.back_end.instructor.adapter.in.web.dto;

import com.example.back_end.course.adapter.in.web.dto.PublicCourseResponse;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record PublicInstructorProfileResponse(
        Long instructorId,
        String fullName,
        String avatar,
        String avatarKey,
        String headline,
        String description,
        String expertise,
        Map<String, String> socialLinks,
        Instant joinedAt,
        long courseCount,
        long studentCount,
        double avgRating,
        long ratingCount,
        List<PublicCourseResponse> courses
) {}
