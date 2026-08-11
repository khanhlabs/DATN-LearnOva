package com.example.back_end.instructor.adapter.in.web.dto;

import jakarta.validation.constraints.Size;

import java.util.Map;

public record UpdateInstructorProfileRequest(
        @Size(max = 150, message = "Headline must be at most 150 characters") String headline,
        @Size(max = 5000, message = "Description must be at most 5000 characters") String description,
        @Size(max = 255, message = "Expertise must be at most 255 characters") String expertise,
        String avatarKey,
        Map<String, String> socialLinks
) {
}
