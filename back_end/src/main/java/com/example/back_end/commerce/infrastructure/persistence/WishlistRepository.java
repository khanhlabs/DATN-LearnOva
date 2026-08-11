package com.example.back_end.commerce.infrastructure.persistence;

import com.example.back_end.commerce.domain.Wishlist;
import com.example.back_end.commerce.domain.WishlistId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WishlistRepository extends JpaRepository<Wishlist, WishlistId> {

    List<Wishlist> findByUser_Id(Long userId);

    boolean existsByUser_IdAndCourse_Id(Long userId, Long courseId);

    void deleteByUser_IdAndCourse_Id(Long userId, Long courseId);
}