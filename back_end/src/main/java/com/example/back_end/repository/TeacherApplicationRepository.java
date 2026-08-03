package com.example.back_end.repository;

import com.example.back_end.entity.TeacherApplication;
import com.example.back_end.entity.enums.TeacherApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeacherApplicationRepository extends JpaRepository<TeacherApplication, Long> {

    Optional<TeacherApplication> findFirstByUser_IdAndStatus(Long userId, TeacherApplicationStatus status);

    List<TeacherApplication> findAllByStatusOrderByCreatedAtAsc(TeacherApplicationStatus status);

    List<TeacherApplication> findAllByUser_IdOrderByCreatedAtDesc(Long userId);
}
