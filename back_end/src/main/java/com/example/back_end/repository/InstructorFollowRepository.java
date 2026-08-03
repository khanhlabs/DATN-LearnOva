package com.example.back_end.repository;

import com.example.back_end.entity.InstructorFollow;
import com.example.back_end.entity.InstructorFollowId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InstructorFollowRepository extends JpaRepository<InstructorFollow, InstructorFollowId> {

    boolean existsByFollower_IdAndInstructor_Id(Long followerId, Long instructorId);

    Optional<InstructorFollow> findByFollower_IdAndInstructor_Id(Long followerId, Long instructorId);

    long countByInstructor_Id(Long instructorId);
}
