package com.example.back_end.ai.domain;

import com.example.back_end.course.domain.Lesson;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "ai_generation_jobs")
public class AiGenerationJob {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "job_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lesson_id", nullable = false)
    private Lesson lesson;

    @Enumerated(EnumType.STRING)
    @Column(name = "generation_type", nullable = false)
    private AiGenerationType generationType;

    @Column(name = "video_key", nullable = false, length = Integer.MAX_VALUE)
    private String videoKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private AiGenerationStatus status;

    @Column(name = "attempts", nullable = false)
    private Integer attempts;

    @Column(name = "error_message", length = Integer.MAX_VALUE)
    private String errorMessage;

    @Column(name = "requested_at", nullable = false)
    private Instant requestedAt;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
