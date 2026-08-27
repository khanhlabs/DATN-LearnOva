package com.example.back_end.user.infrastructure.persistence;

import com.example.back_end.user.domain.InstructorFollow;
import com.example.back_end.user.domain.InstructorFollowId;
import com.example.back_end.auth.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InstructorFollowRepository extends JpaRepository<InstructorFollow, InstructorFollowId> {

    boolean existsByFollower_IdAndInstructor_Id(Long followerId, Long instructorId);

    Optional<InstructorFollow> findByFollower_IdAndInstructor_Id(Long followerId, Long instructorId);

    long countByInstructor_Id(Long instructorId);

    @Query("""
            SELECT follow.follower
            FROM InstructorFollow follow
            WHERE follow.instructor.id = :instructorId
              AND follow.follower.isDeleted = false
              AND follow.follower.isActive = true
            """)
    List<User> findActiveFollowersByInstructorId(@Param("instructorId") Long instructorId);
}
