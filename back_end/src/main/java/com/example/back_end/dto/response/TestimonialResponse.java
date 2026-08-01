package com.example.back_end.dto.response;

public record TestimonialResponse(
        Long reviewId,
        String reviewerName,
        String reviewerAvatar,
        Integer rating,
        String comment,
        String courseTitle
) {}
