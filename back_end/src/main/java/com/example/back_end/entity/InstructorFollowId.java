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
public class InstructorFollowId implements Serializable {
    @Serial
    private static final long serialVersionUID = -6269541497494496596L;
    @NotNull
    @Column(name = "follower_id", nullable = false)
    private Long followerId;

    @NotNull
    @Column(name = "instructor_id", nullable = false)
    private Long instructorId;


}