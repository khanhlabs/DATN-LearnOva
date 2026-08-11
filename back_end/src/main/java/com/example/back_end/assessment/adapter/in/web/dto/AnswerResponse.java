package com.example.back_end.assessment.adapter.in.web.dto;

import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
public class AnswerResponse {
    private Long id;
    private String content;

    private Long userId;
    private String userName;

    private Instant createdAt;

    private Integer likeCount;
    private Boolean likedByCurrentUser;
    private Boolean instructor;
    private Long parentId;
    private Long replyToUserId;
    private String replyToUserName;

    private Long rootId;
    private Integer level;
    private List<AnswerResponse> replies;
}
