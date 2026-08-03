package com.example.back_end.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {
    List<QuizAttempt> findByQuizIdAndUserIdOrderByCreatedAtDesc(Long quizId, Long userId);
}
