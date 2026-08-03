package com.example.back_end.repository.admin;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.back_end.entity.Category;

public interface AdminCategoryRepository extends JpaRepository<Category, Long> {

    @Query("SELECT c FROM Category c WHERE c.isDeleted = false ORDER BY c.id ASC")
    List<Category> findAllActive();

    @Query("SELECT c FROM Category c LEFT JOIN FETCH c.parent ORDER BY c.id ASC")
    List<Category> findAllForAdmin();

    @Query("SELECT c FROM Category c WHERE c.id = :id AND c.isDeleted = false")
    Optional<Category> findActiveById(@Param("id") Long id);

    @Query("SELECT c FROM Category c WHERE c.id = :id")
    Optional<Category> findByIdForAdmin(@Param("id") Long id);

    @Query("SELECT c FROM Category c LEFT JOIN FETCH c.parent WHERE c.parent.id = :parentId AND c.isDeleted = false")
    List<Category> findChildrenByParentId(@Param("parentId") Long parentId);

    @Query("SELECT COUNT(c) FROM Category c WHERE c.slug = :slug AND c.isDeleted = false AND c.id != :id")
    long countBySlugAndNotId(@Param("slug") String slug, @Param("id") Long id);

    @Query("SELECT COUNT(c) FROM Category c WHERE c.slug = :slug AND c.isDeleted = false")
    long countBySlug(@Param("slug") String slug);
}
