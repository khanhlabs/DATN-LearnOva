package com.example.back_end.commerce.infrastructure.persistence;

import com.example.back_end.entity.LessonQALike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LessonQALikeRepository extends JpaRepository<LessonQALike, Long> {
    Optional<LessonQALike> findByQa_IdAndUser_Id(Long qaId, Long userId);

    boolean existsByQa_IdAndUser_Id(Long qaId, Long userId);
}
