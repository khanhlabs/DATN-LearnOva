package com.example.back_end.repository.admin;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.back_end.entity.Tag;

public interface AdminTagRepository extends JpaRepository<Tag, Long> {

    @Query("SELECT t FROM Tag t ORDER BY t.id ASC")
    List<Tag> findAllForAdmin();

    @Query("SELECT t FROM Tag t WHERE t.id = :id")
    Optional<Tag> findByIdForAdmin(@Param("id") Long id);

    @Query("SELECT tag FROM Tag tag WHERE tag.isDeleted = false ORDER BY tag.name")
    List<Tag> findAllActive();

    @Query("SELECT tag FROM Tag tag WHERE tag.id = :id AND tag.isDeleted = false")
    Optional<Tag> findActiveById(@Param("id") Long id);

    @Query("SELECT COUNT(t) FROM Tag t WHERE t.slug = :slug AND t.id != :id")
    long countBySlugAndNotId(@Param("slug") String slug, @Param("id") Long id);

    @Query("SELECT COUNT(t) FROM Tag t WHERE t.slug = :slug")
    long countBySlug(@Param("slug") String slug);

    @Query("SELECT t FROM Tag t WHERE t.id IN :ids AND t.isDeleted = false")
    List<Tag> findByIdIn(@Param("ids") List<Long> ids);
}
