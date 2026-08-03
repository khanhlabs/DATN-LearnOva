package com.example.back_end.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "lesson_qa")
public class LessonQA {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "qa_id", nullable = false)
    private Long id;

    // ================== LESSON ==================
    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "lesson_id", nullable = false)
    private Lesson lesson;

    // ================== USER ==================
    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // ================== PARENT (reply) ==================
    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "parent_id")
    private LessonQA parent;

    // ================== CONTENT ==================
    @NotNull
    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    // ================== TYPE ==================
    @Column(name = "type", length = 10)
    @ColumnDefault("'QUESTION'")
    private String type;

    // ================== FLAGS ==================
    @Column(name = "is_solved")
    @ColumnDefault("false")
    private Boolean isSolved;

    @Column(name = "is_pinned")
    @ColumnDefault("false")
    private Boolean isPinned;

    // ================== LIKE ==================
    @Column(name = "like_count")
    @ColumnDefault("0")
    private Integer likeCount;

    // ================== TIMESTAMP ==================
    @NotNull
    @Column(name = "created_at", nullable = false)
    @ColumnDefault("CURRENT_TIMESTAMP")
    private Instant createdAt;

    @NotNull
    @Column(name = "updated_at", nullable = false)
    @ColumnDefault("CURRENT_TIMESTAMP")
    private Instant updatedAt;

    // ================== SOFT DELETE ==================
    @NotNull
    @Column(name = "is_deleted", nullable = false)
    @ColumnDefault("false")
    private Boolean isDeleted;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reply_to_user_id")
    private User replyToUser;

    @Column(name = "root_id")
    private Long rootId;

    @Column(name = "level")
    private Integer level;
}