package com.example.back_end.entity;

import com.example.back_end.entity.enums.HlsStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.LinkedHashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "lessons")
public class Lesson {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "lesson_id", nullable = false)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "section_id", nullable = false)
    private Section section;

    @NotNull
    @Column(name = "title", nullable = false, length = Integer.MAX_VALUE)
    private String title;

    @Column(name = "video_key", length = Integer.MAX_VALUE)
    private String videoKey;

    @Column(name = "video_original_filename", length = Integer.MAX_VALUE)
    private String videoOriginalFilename;

    @Column(name = "video_content_type", length = 100)
    private String videoContentType;

    @Column(name = "video_size_bytes")
    private Long videoSizeBytes;

    @Enumerated(EnumType.STRING)
    @Column(name = "hls_status", length = Integer.MAX_VALUE)
    private HlsStatus hlsStatus;

    @Column(name = "media_convert_job_id", length = Integer.MAX_VALUE)
    private String mediaConvertJobId;

    @Column(name = "hls_playlist_key", length = Integer.MAX_VALUE)
    private String hlsPlaylistKey;

    @NotNull
    @Column(name = "lesson_order", nullable = false)
    private Double lessonOrder;

    @ColumnDefault("0")
    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @NotNull
    @ColumnDefault("0")
    @Column(name = "view_count", nullable = false)
    private Integer viewCount;

    @NotNull
    @ColumnDefault("false")
    @Column(name = "is_preview", nullable = false)
    private Boolean isPreview;

    @NotNull
    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @NotNull
    @ColumnDefault("false")
    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted;

    @NotNull
    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "lesson")
    private Set<LessonProgress> lessonProgresses = new LinkedHashSet<>();

    @OneToMany(mappedBy = "lesson", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<LessonSource> lessonSources = new LinkedHashSet<>();


}
