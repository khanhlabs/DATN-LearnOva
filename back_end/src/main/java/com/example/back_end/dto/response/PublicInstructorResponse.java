package com.example.back_end.dto.response;

import java.util.List;

public record PublicInstructorResponse(
        Long instructorId,
        String fullName,
        String avatar,
        String headline,
        String description,
        List<String> expertiseTags,
        double rating,
        long reviewCount,
        long studentCount,
        long courseCount,
        long followerCount
) {}
