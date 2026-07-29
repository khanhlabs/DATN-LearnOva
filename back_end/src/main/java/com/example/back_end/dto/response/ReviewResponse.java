package com.example.back_end.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.OffsetDateTime;

@Data
@Builder
public class ReviewResponse {
    private Long reviewId;
    private Long userId;
    private String userName;
    private Integer rating;
    private String comment;
    private Instant createdAt;
    private Instant updatedAt;
    private boolean edited;
    private String avatar;
    private String instructorReply;
    private OffsetDateTime repliedAt;
}
