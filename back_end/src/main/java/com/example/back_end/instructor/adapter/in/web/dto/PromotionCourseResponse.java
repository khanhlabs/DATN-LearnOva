package com.example.back_end.instructor.adapter.in.web.dto;

public record PromotionCourseResponse(
        Long courseId,
        Long promotionId,
        Integer discountPercent,
        String startDate,
        String endDate
) {
}
