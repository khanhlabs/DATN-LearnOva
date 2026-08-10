package com.example.back_end.assessment.adapter.in.web.dto;

public record TestimonialResponse(
        Long reviewId,
        String reviewerName,
        String reviewerAvatar,
        Integer rating,
        String comment,
        String courseTitle
) {}
