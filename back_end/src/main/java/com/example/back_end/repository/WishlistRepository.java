package com.example.back_end.repository;

import com.example.back_end.entity.Wishlist;
import com.example.back_end.entity.WishlistId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WishlistRepository extends JpaRepository<Wishlist, WishlistId> {

    List<Wishlist> findByUser_Id(Long userId);

    boolean existsByUser_IdAndCourse_Id(Long userId, Long courseId);

    void deleteByUser_IdAndCourse_Id(Long userId, Long courseId);
}