    package com.example.back_end.entity;

    import com.example.back_end.entity.enums.CourseLevel;
    import com.example.back_end.entity.enums.CourseStatus;
    import jakarta.persistence.*;
    import jakarta.validation.constraints.NotNull;
    import jakarta.validation.constraints.Size;
    import lombok.Getter;
    import lombok.Setter;
    import org.hibernate.annotations.ColumnDefault;
    import org.hibernate.annotations.JdbcTypeCode;
    import org.hibernate.type.SqlTypes;

    import java.math.BigDecimal;
    import java.time.Instant;
    import java.time.OffsetDateTime;
    import java.util.LinkedHashSet;
    import java.util.List;
    import java.util.Set;

    @Getter
    @Setter
    @Entity
    @Table(name = "courses")
    public class Course {
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        @Column(name = "course_id", nullable = false)
        private Long id;

        @NotNull
        @Column(name = "title", nullable = false, length = Integer.MAX_VALUE)
        private String title;

        @NotNull
        @Column(name = "slug", nullable = false, length = Integer.MAX_VALUE)
        private String slug;

        @NotNull
        @Column(name = "description", nullable = false, length = Integer.MAX_VALUE)
        private String description;

        @Size(max = 10)
        @NotNull
        @ColumnDefault("'vi'")
        @Column(name = "language", nullable = false, length = 10)
        private String language;

        @JdbcTypeCode(SqlTypes.ARRAY)
        @Column(name = "requirements", columnDefinition = "text[]")
        private List<String> requirements;

        @JdbcTypeCode(SqlTypes.ARRAY)
        @Column(name = "what_you_learn", columnDefinition = "text[]")
        private List<String> whatYouLearn;

        @NotNull
        @Column(name = "base_price", nullable = false, precision = 10, scale = 2)
        private BigDecimal basePrice;

        @Enumerated(EnumType.STRING)
        @Column(name = "level", columnDefinition = "course_level not null")
        @org.hibernate.annotations.JdbcTypeCode(SqlTypes.NAMED_ENUM)
        private CourseLevel level;

        @Enumerated(EnumType.STRING)
        @ColumnDefault("'DRAFT'")
        @Column(name = "status", columnDefinition = "course_status not null")
        @org.hibernate.annotations.JdbcTypeCode(SqlTypes.NAMED_ENUM)
        private CourseStatus status;

        @NotNull
        @ManyToOne(fetch = FetchType.LAZY, optional = false)
        @JoinColumn(name = "instructor_id", nullable = false)
        private User instructor;

        @NotNull
        @ColumnDefault("false")
        @Column(name = "is_deleted", nullable = false)
        private Boolean isDeleted;

        @NotNull
        @ColumnDefault("false")
        @Column(name = "is_hidden", nullable = false)
        private Boolean isHidden;

        @NotNull
        @ColumnDefault("CURRENT_TIMESTAMP")
        @Column(name = "created_at", nullable = false)
        private Instant createdAt;

        @Column(name = "published_at")
        private OffsetDateTime publishedAt;

        @Column(name = "rejection_reason", length = Integer.MAX_VALUE)
        private String rejectionReason;

        @NotNull
        @ColumnDefault("CURRENT_TIMESTAMP")
        @Column(name = "updated_at", nullable = false)
        private Instant updatedAt;

        @Column(name = "thumbnail_key", length = Integer.MAX_VALUE)
        private String thumbnailKey;

        @OneToMany(mappedBy = "course")
        private Set<Cart> carts = new LinkedHashSet<>();

        @OneToMany(mappedBy = "course")
        private Set<CourseCategory>  courseCategories = new LinkedHashSet<>();

        @ManyToMany
        @JoinTable(
                name = "course_tags",
                joinColumns = @JoinColumn(name = "course_id"),
                inverseJoinColumns = @JoinColumn(name = "tag_id")
        )
        private Set<Tag> tags = new LinkedHashSet<>();

        @OneToMany(mappedBy = "course")
        private Set<Enrollment> enrollments = new LinkedHashSet<>();

        @OneToMany(mappedBy = "course")
        private Set<OrderItem> orderItems = new LinkedHashSet<>();

        @ManyToMany
        @JoinTable(
                name = "promotion_courses",
                joinColumns = @JoinColumn(name = "course_id"),
                inverseJoinColumns = @JoinColumn(name = "promotion_id")
        )
        private Set<Promotion> promotions = new LinkedHashSet<>();

        @OneToMany(mappedBy = "course")
        private Set<Review> reviews = new LinkedHashSet<>();

        @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
        private Set<Section> sections = new LinkedHashSet<>();

        @OneToMany(mappedBy = "course")
        private Set<Wishlist> wishlists = new LinkedHashSet<>();


    }
