package com.example.back_end.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.NotNull;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

import java.io.Serial;
import java.io.Serializable;

@Getter
@Setter
@EqualsAndHashCode
@Embeddable
public class PromotionCoursId implements Serializable {
    @Serial
    private static final long serialVersionUID = 6647436332841827974L;
    @NotNull
    @Column(name = "promotion_id", nullable = false)
    private Long promotionId;

    @NotNull
    @Column(name = "course_id", nullable = false)
    private Long courseId;


}