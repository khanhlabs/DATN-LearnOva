package com.example.back_end.assessment.adapter.in.web.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class RatingSummaryResponse {
    private double averageRating;
    private long totalReviews;
}