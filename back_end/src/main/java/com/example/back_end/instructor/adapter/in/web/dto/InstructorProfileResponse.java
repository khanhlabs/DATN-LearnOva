package com.example.back_end.instructor.adapter.in.web.dto;

import java.util.Map;

public record InstructorProfileResponse(
        String headline,
        String description,
        String expertise,
        String avatarKey,
        Map<String, String> socialLinks
) {}
