package com.example.back_end.assessment.adapter.in.web.dto;

import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
public class QuestionResponse {
    private Long id;
    private String content;

    private Long userId;
    private String userName;

    private Instant createdAt;

    private Boolean isSolved;
    private Boolean isPinned;

    private Integer likeCount;
    private Boolean likedByCurrentUser;

    private List<AnswerResponse> answers;
    private Long rootId;

}
