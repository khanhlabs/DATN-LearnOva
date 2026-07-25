package com.example.back_end.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;

@Entity
@Getter
@Setter
@Table(name = "instructor_profile")
public class InstructorProfile {

    @Id
    private Long id;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "instructor_id", nullable = false)
    private User user;

    @Column(name = "headline")
    private String headline;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "expertise")
    private String expertise;

    @Column(name = "avatarkey")
    private String avatarKey;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "social_links", columnDefinition = "jsonb")
    private Map<String, String> socialLinks;

    private Instant createdAt;
    private Instant updatedAt;
}