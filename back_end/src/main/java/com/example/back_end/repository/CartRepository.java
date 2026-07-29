package com.example.back_end.repository;

import com.example.back_end.entity.Cart;
import com.example.back_end.entity.CartId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CartRepository extends JpaRepository<Cart, CartId> {

    @Query("""
            SELECT c FROM Cart c
            JOIN FETCH c.course course
            JOIN FETCH course.instructor
            WHERE c.user.id = :userId
            ORDER BY c.createdAt DESC
            """)
    List<Cart> findAllByUserIdWithCourse(@Param("userId") Long userId);

    boolean existsByUser_IdAndCourse_Id(Long userId, Long courseId);

    void deleteByUser_IdAndCourse_Id(Long userId, Long courseId);
}
