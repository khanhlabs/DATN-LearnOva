package com.example.back_end.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;

@Getter
@Setter
@Entity
@Table(name = "instructor_profile")
public class InstructorProfile {
    @Id
    @Column(name = "instructor_id", nullable = false)
    private Long id;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "instructor_id", nullable = false)
    private User users;

    @Size(max = 255)
    @Column(name = "headline")
    private String headline;

    @Column(name = "description", length = Integer.MAX_VALUE)
    private String description;

    @Size(max = 255)
    @Column(name = "expertise")
    private String expertise;

    @Column(name = "avatar_key", length = Integer.MAX_VALUE)
    private String avatarKey;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "social_links")
    private Map<String, Object> socialLinks;

    @ColumnDefault("now()")
    @Column(name = "created_at")
    private Instant createdAt;

    @ColumnDefault("now()")
    @Column(name = "updated_at")
    private Instant updatedAt;


}