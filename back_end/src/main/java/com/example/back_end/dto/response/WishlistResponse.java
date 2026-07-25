package com.example.back_end.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class WishlistResponse {

    private Long courseId;

    private String courseTitle;

    private String thumbnail;

    private String instructor;

    private Double price;
    private String category;
    private String summary;
    private String progressText;
    private String remaining;

    private Double averageRating;

    private Long reviewCount;
    private Boolean purchased;
    private String language;

    private String level;

}