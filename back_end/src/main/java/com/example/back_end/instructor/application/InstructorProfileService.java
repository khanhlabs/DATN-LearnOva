package com.example.back_end.instructor.application;

import com.example.back_end.instructor.adapter.in.web.dto.UpdateInstructorProfileRequest;
import com.example.back_end.instructor.adapter.in.web.dto.InstructorProfileResponse;
import com.example.back_end.instructor.domain.InstructorProfile;
import com.example.back_end.auth.domain.User;
import com.example.back_end.shared.exception.ResourceNotFoundException;
import com.example.back_end.instructor.infrastructure.persistence.InstructorProfileRepository;
import com.example.back_end.auth.infrastructure.persistence.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
@Transactional
public class InstructorProfileService {

    private final InstructorProfileRepository instructorProfileRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public InstructorProfileResponse getMyProfile(String email) {
        User instructor = userRepository
                .findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return instructorProfileRepository.findById(instructor.getId())
                .map(this::toResponse)
                .orElse(new InstructorProfileResponse(null, null, null, null, null));
    }

    public InstructorProfileResponse updateMyProfile(String email, UpdateInstructorProfileRequest request) {
        User instructor = userRepository
                .findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        InstructorProfile profile = instructorProfileRepository.findById(instructor.getId())
                .orElseGet(() -> {
                    InstructorProfile created = new InstructorProfile();
                    created.setUser(instructor);
                    created.setCreatedAt(Instant.now());
                    return created;
                });

        profile.setHeadline(request.headline());
        profile.setDescription(request.description());
        profile.setExpertise(request.expertise());
        if (request.avatarKey() != null) {
            profile.setAvatarKey(request.avatarKey());
        }
        profile.setSocialLinks(request.socialLinks());
        profile.setUpdatedAt(Instant.now());

        instructorProfileRepository.save(profile);
        return toResponse(profile);
    }

    private InstructorProfileResponse toResponse(InstructorProfile profile) {
        return new InstructorProfileResponse(
                profile.getHeadline(),
                profile.getDescription(),
                profile.getExpertise(),
                profile.getAvatarKey(),
                profile.getSocialLinks()
        );
    }
}
