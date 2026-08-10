package com.example.back_end.admin.application;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.back_end.admin.adapter.in.web.dto.AdminUserRequest;
import com.example.back_end.admin.adapter.in.web.dto.AdminUserResponse;
import com.example.back_end.auth.domain.Role;
import com.example.back_end.auth.domain.User;
import com.example.back_end.auth.domain.enums.RoleName;
import com.example.back_end.shared.exception.BusinessException;
import com.example.back_end.shared.exception.ResourceNotFoundException;
import com.example.back_end.auth.infrastructure.persistence.RoleRepository;
import com.example.back_end.admin.infrastructure.persistence.AdminUserRepository;
import com.example.back_end.media.infrastructure.storage.S3Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminUserService {

    private final AdminUserRepository adminUserRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final S3Service s3Service;

    public List<AdminUserResponse> getAllUsers() {
        return adminUserRepository.findAll()
            .stream()
            .map(user -> {
                String roleText = user.getRoles()
                    .stream()
                    .map(role -> role.getRoleName().name().replace("ROLE_", ""))
                    .findFirst()
                    .orElse("USER");

                String statusText = Boolean.TRUE.equals(user.getIsActive()) ? "Active" : "Inactive";

                return new AdminUserResponse(
                    user.getId(),
                    user.getFullName(),
                    user.getEmail(),
                    user.getPhone(),
                    s3Service.resolveAvatarUrl(user.getAvatar()),
                    user.getCoverImage(),
                    user.getDateOfBirth(),
                    user.getGender(),
                    roleText,
                    statusText,
                    user.getCreatedAt(),
                    user.getIsDeleted(),
                    user.getUpdatedAt()
                );
            })
            .toList();
    }

    public AdminUserResponse createUser(AdminUserRequest request) {
        if (request.password() == null || request.password().isBlank()) {
            throw new BusinessException("Password is required");
        }

        String normalizedRole = request.role() == null
            ? "USER"
            : request.role().replace("ROLE_", "").trim().toUpperCase();

        RoleName roleName = switch (normalizedRole) {
            case "ADMIN" -> RoleName.ROLE_ADMIN;
            case "TEACHER", "INSTRUCTOR" -> RoleName.ROLE_TEACHER;
            default -> RoleName.ROLE_USER;
        };

        Role role = roleRepository.findByRoleName(roleName)
            .orElseThrow(() -> new RuntimeException("Role not found"));

        User user = new User();
        user.setFullName(request.fullName());
        user.setEmail(request.email());
        user.setPhone(request.phone());
        user.setAvatar(request.avatar());
        user.setCoverImage(request.coverImage());
        user.setDateOfBirth(request.dateOfBirth());
        user.setGender(request.gender());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setIsActive(request.isActive() != null ? request.isActive() : true);
        user.setIsDeleted(request.isDeleted() != null ? request.isDeleted() : false);
        user.setRoles(new LinkedHashSet<>(List.of(role)));
        Instant now = Instant.now();
        user.setCreatedAt(now);
        user.setUpdatedAt(now);

        User savedUser = adminUserRepository.save(user);

        String roleText = savedUser.getRoles()
            .stream()
            .map(savedRole -> savedRole.getRoleName().name().replace("ROLE_", ""))
            .findFirst()
            .orElse("USER");

        String statusText = Boolean.TRUE.equals(savedUser.getIsActive()) ? "Active" : "Inactive";

        return new AdminUserResponse(
            savedUser.getId(),
            savedUser.getFullName(),
            savedUser.getEmail(),
            savedUser.getPhone(),
            s3Service.resolveAvatarUrl(savedUser.getAvatar()),
            savedUser.getCoverImage(),
            savedUser.getDateOfBirth(),
            savedUser.getGender(),
            roleText,
            statusText,
            savedUser.getCreatedAt(),
            savedUser.getIsDeleted(),
            savedUser.getUpdatedAt()
        );
    }

    public AdminUserResponse updateUser(Long id, AdminUserRequest request) {
        User user = adminUserRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (request.fullName() != null) {
            user.setFullName(request.fullName());
        }
        if (request.phone() != null) {
            user.setPhone(request.phone());
        }
        if (request.avatar() != null) {
            user.setAvatar(request.avatar());
        }
        if (request.coverImage() != null) {
            user.setCoverImage(request.coverImage());
        }
        if (request.dateOfBirth() != null) {
            user.setDateOfBirth(request.dateOfBirth());
        }
        if (request.gender() != null) {
            user.setGender(request.gender());
        }
        if (request.password() != null && !request.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }
        if (request.isActive() != null) {
            user.setIsActive(request.isActive());
        }
        if (request.isDeleted() != null) {
            user.setIsDeleted(request.isDeleted());
        }
        if (request.role() != null) {
            String normalizedRole = request.role().replace("ROLE_", "").trim().toUpperCase();

            RoleName roleName = switch (normalizedRole) {
                case "ADMIN" -> RoleName.ROLE_ADMIN;
                case "TEACHER", "INSTRUCTOR" -> RoleName.ROLE_TEACHER;
                default -> RoleName.ROLE_USER;
            };

            Role role = roleRepository.findByRoleName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found"));

            // Grant the selected role instead of replacing the whole set — a user who
            // gained an extra role elsewhere (e.g. approved instructor application)
            // must not lose it just because an admin edited an unrelated field here.
            boolean alreadyHasRole = user.getRoles().stream()
                .anyMatch(r -> r.getRoleName() == roleName);
            boolean isAlreadyAdmin = user.getRoles().stream()
                .anyMatch(r -> r.getRoleName() == RoleName.ROLE_ADMIN);
            if (!alreadyHasRole) {
                user.getRoles().add(role);
                // Admins don't participate in the active_role switch model — granting them
                // an extra role must not silently scope their authority away from ROLE_ADMIN.
                if (!isAlreadyAdmin) {
                    user.setActiveRole(roleName);
                }
            }
        }

        user.setUpdatedAt(Instant.now());

        User updatedUser = adminUserRepository.save(user);

        String roleText = updatedUser.getRoles()
            .stream()
            .map(role -> role.getRoleName().name().replace("ROLE_", ""))
            .findFirst()
            .orElse("USER");

        String statusText = Boolean.TRUE.equals(updatedUser.getIsActive()) ? "Active" : "Inactive";

        return new AdminUserResponse(
            updatedUser.getId(),
            updatedUser.getFullName(),
            updatedUser.getEmail(),
            updatedUser.getPhone(),
            s3Service.resolveAvatarUrl(updatedUser.getAvatar()),
            updatedUser.getCoverImage(),
            updatedUser.getDateOfBirth(),
            updatedUser.getGender(),
            roleText,
            statusText,
            updatedUser.getCreatedAt(),
            updatedUser.getIsDeleted(),
            updatedUser.getUpdatedAt()
        );
    }

    public void deleteUser(Long id) {
        User user = adminUserRepository.findByIdAndIsDeletedFalse(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setIsDeleted(true);
        user.setUpdatedAt(Instant.now());
        adminUserRepository.save(user);
    }
}
