package com.example.back_end.service;

import com.example.back_end.dto.response.FollowStatusResponse;
import com.example.back_end.entity.InstructorFollow;
import com.example.back_end.entity.InstructorFollowId;
import com.example.back_end.entity.User;
import com.example.back_end.entity.enums.NotificationType;
import com.example.back_end.exception.BusinessException;
import com.example.back_end.exception.ResourceNotFoundException;
import com.example.back_end.repository.InstructorFollowRepository;
import com.example.back_end.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class InstructorFollowService {

    private final InstructorFollowRepository instructorFollowRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public FollowStatusResponse follow(Long instructorId, String followerEmail) {
        User follower = userRepository.findByEmailAndIsDeletedFalse(followerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        User instructor = userRepository.findById(instructorId)
                .orElseThrow(() -> new ResourceNotFoundException("Instructor not found"));

        if (follower.getId().equals(instructorId)) {
            throw new BusinessException("You cannot follow yourself");
        }

        if (!instructorFollowRepository.existsByFollower_IdAndInstructor_Id(follower.getId(), instructorId)) {
            InstructorFollow follow = new InstructorFollow();
            follow.setId(new InstructorFollowId());
            follow.getId().setFollowerId(follower.getId());
            follow.getId().setInstructorId(instructorId);
            follow.setFollower(follower);
            follow.setInstructor(instructor);
            follow.setCreatedAt(Instant.now());
            instructorFollowRepository.save(follow);

            notificationService.create(
                    instructor,
                    NotificationType.INSTRUCTOR_FOLLOWED,
                    "New follower",
                    (follower.getFullName() != null ? follower.getFullName() : "A learner")
                            + " started following you.",
                    "/learnova/intructorDetail/" + instructor.getId(),
                    null);
        }

        return status(instructorId, follower.getId());
    }

    @Transactional
    public FollowStatusResponse unfollow(Long instructorId, String followerEmail) {
        User follower = userRepository.findByEmailAndIsDeletedFalse(followerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        instructorFollowRepository.findByFollower_IdAndInstructor_Id(follower.getId(), instructorId)
                .ifPresent(instructorFollowRepository::delete);

        return status(instructorId, follower.getId());
    }

    @Transactional(readOnly = true)
    public FollowStatusResponse getStatus(Long instructorId, String followerEmail) {
        User follower = userRepository.findByEmailAndIsDeletedFalse(followerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return status(instructorId, follower.getId());
    }

    private FollowStatusResponse status(Long instructorId, Long followerId) {
        boolean following = instructorFollowRepository
                .existsByFollower_IdAndInstructor_Id(followerId, instructorId);
        long followerCount = instructorFollowRepository.countByInstructor_Id(instructorId);
        return new FollowStatusResponse(following, followerCount);
    }
}
