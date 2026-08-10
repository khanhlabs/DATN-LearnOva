package com.example.back_end.instructor.infrastructure.persistence;

import com.example.back_end.instructor.domain.TeacherApplication;
import com.example.back_end.instructor.domain.enums.TeacherApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeacherApplicationRepository extends JpaRepository<TeacherApplication, Long> {

    Optional<TeacherApplication> findFirstByUser_IdAndStatus(Long userId, TeacherApplicationStatus status);

    List<TeacherApplication> findAllByStatusOrderByCreatedAtAsc(TeacherApplicationStatus status);

    List<TeacherApplication> findAllByUser_IdOrderByCreatedAtDesc(Long userId);
}
