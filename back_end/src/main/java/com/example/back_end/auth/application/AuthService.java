package com.example.back_end.auth.application;
import com.example.back_end.auth.infrastructure.EmailService;
import com.example.back_end.media.infrastructure.storage.S3Service;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.back_end.auth.adapter.in.web.dto.AuthTokenResponse;
import com.example.back_end.user.adapter.in.web.dto.CurrentUserResponse;
import com.example.back_end.auth.adapter.in.web.dto.LoginRequest;
import com.example.back_end.auth.domain.Role;
import com.example.back_end.auth.domain.User;
import com.example.back_end.auth.domain.VerificationToken;
import com.example.back_end.auth.domain.enums.RoleName;
import com.example.back_end.shared.exception.BusinessException;
import com.example.back_end.shared.exception.ResourceNotFoundException;
import com.example.back_end.auth.infrastructure.persistence.RoleRepository;
import com.example.back_end.auth.infrastructure.persistence.UserRepository;
import com.example.back_end.security.CustomUserDetailsService;
import com.example.back_end.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import java.util.Optional;
import java.util.Set;
import com.example.back_end.auth.adapter.in.web.dto.RegisterRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.time.Instant;
import com.example.back_end.user.adapter.in.web.dto.UserResponse;
import com.example.back_end.user.adapter.in.web.dto.UpdateProfileRequest;
import com.example.back_end.auth.adapter.in.web.dto.ChangePasswordRequest;


@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final VerificationTokenService verificationTokenService;
    private final CustomUserDetailsService customUserDetailsService;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final S3Service s3Service;

    @Value("${app.frontend.base-url}")
    private String frontendBaseUrl;


    @Transactional
    public AuthTokenResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                request.email().trim().toLowerCase(),
                request.password()
            )
        );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        if (userDetails == null) {
            throw new BusinessException("Authentication failed");
        }

        String accessToken = jwtService.generateAccessToken(userDetails);
        VerificationToken refreshToken = verificationTokenService.createRefreshToken(userDetails.getUsername(), request.rememberMe());

        return new AuthTokenResponse(accessToken, refreshToken.getToken());
    }

    // Rotates the refresh token on every use — a stolen token can only be used once.
    @Transactional
    public AuthTokenResponse refreshAccessToken(String refreshToken) {
        VerificationToken validRefreshToken = verificationTokenService.verifyRefreshToken(refreshToken);

        User user = validRefreshToken.getUser();
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(user.getEmail());
        String newAccessToken = jwtService.generateAccessToken(userDetails);

        verificationTokenService.deleteRefreshTokenByUser(user);
        String newRefreshToken = verificationTokenService.createRefreshToken(user.getEmail(), false).getToken();

        return new AuthTokenResponse(newAccessToken, newRefreshToken);
    }

    // Always succeeds — even if the token is expired or unknown.
    @Transactional
    public void logout(String refreshToken) {
        if (refreshToken == null) {
            return;
        }
        try {
            VerificationToken token = verificationTokenService.verifyRefreshToken(refreshToken);
            verificationTokenService.deleteRefreshTokenByUser(token.getUser());
        } catch (Exception ignored) {
            // Token already expired or not found — still a valid logout.
        }
    }

    public CurrentUserResponse getCurrentUser(String email) {
        User user = userRepository
                .findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return toCurrentUserResponse(user);
    }

    @Transactional
    public CurrentUserResponse switchActiveRole(String email, RoleName role) {
        User user = userRepository
                .findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        boolean isAdmin = user.getRoles().stream()
                .anyMatch(r -> r.getRoleName() == RoleName.ROLE_ADMIN);
        if (isAdmin) {
            throw new BusinessException("Quản trị viên không thể chuyển đổi vai trò.");
        }

        boolean hasRole = user.getRoles().stream()
                .anyMatch(r -> r.getRoleName() == role);
        if (!hasRole) {
            throw new BusinessException("User does not have role " + role);
        }

        user.setActiveRole(role);
        userRepository.save(user);

        return toCurrentUserResponse(user);
    }

    private CurrentUserResponse toCurrentUserResponse(User user) {
        Set<RoleName> roleNames = user.getRoles().stream()
                .map(Role::getRoleName)
                .collect(java.util.stream.Collectors.toSet());

        return new CurrentUserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                s3Service.resolveAvatarUrl(user.getAvatar()),
                user.getCoverImage(),
                user.getDateOfBirth(),
                user.getGender(),
                roleNames,
                user.getActiveRole()
        );
    }

    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.existsUsersByEmail(request.email())) {
            throw new BusinessException("Email already exists.");
        }
        if (request.password() == null || request.password().length() < 6) {
            throw new BusinessException("Password must be at least 6 characters long.");
        }
        if (!request.password().equals(request.confirmPassword())) {
            throw new BusinessException("Passwords do not match.");
        }

        Role userRole = roleRepository.findByRoleName(RoleName.ROLE_USER)
                .orElseThrow(() -> new BusinessException("ROLE_USER not found"));

        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setEmail(request.email().trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setIsActive(false);
        user.setIsDeleted(false);
        user.setCreatedAt(Instant.now());
        user.setRoles(Set.of(userRole));

        User savedUser = userRepository.save(user);

        VerificationToken verificationToken = verificationTokenService.createActiveAccountToken(savedUser);

        String verifyLink = frontendBaseUrl + "/learnova/auth/login?token=" + verificationToken.getToken();

        emailService.sendVerificationEmail(savedUser.getEmail(), savedUser.getFullName(), verifyLink);
    }

    @Transactional
    public void verifyEmail(String token) {
        // Expiry is now checked inside verifyActiveAccountToken.
        VerificationToken verificationToken = verificationTokenService.verifyActiveAccountToken(token);

        User user = verificationToken.getUser();
        user.setIsActive(true);
        userRepository.save(user);

        verificationTokenService.markAsUsed(verificationToken);
    }

    @Transactional
    public void resendVerificationEmail(String email) {
        Optional<User> userOpt = userRepository.findByEmailAndIsDeletedFalse(email.trim().toLowerCase());

        // Do not reveal whether the email is registered or already verified.
        if (userOpt.isEmpty() || Boolean.TRUE.equals(userOpt.get().getIsActive())) {
            return;
        }

        User user = userOpt.get();
        VerificationToken verificationToken = verificationTokenService.createActiveAccountToken(user);
        String verifyLink = frontendBaseUrl + "/learnova/auth/login?token=" + verificationToken.getToken();

        emailService.sendVerificationEmail(user.getEmail(), user.getFullName(), verifyLink);
    }
    public UserResponse getUserProfile(String email) {

        User user = userRepository
                .findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String role = user.getRoles().stream()
                .findFirst()
                .map(roleItem -> roleItem.getRoleName().name())
                .orElse("");

        String status = Boolean.TRUE.equals(user.getIsActive())
                ? "Active"
                : "Inactive";

        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                s3Service.resolveAvatarUrl(user.getAvatar()),
                user.getCoverImage(),
                user.getDateOfBirth(),
                user.getGender(),
                role,
                status,
                user.getCreatedAt(),
                user.getIsDeleted(),
                user.getUpdatedAt()
        );
    }
    @Transactional
    public UserResponse updateProfile(String email, UpdateProfileRequest request) {

        User user = userRepository
                .findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setFullName(request.fullName());
        user.setPhone(request.phone());
        user.setDateOfBirth(request.dateOfBirth());
        user.setGender(request.gender());
        user.setUpdatedAt(Instant.now());

        userRepository.save(user);

        String role = user.getRoles().stream()
                .findFirst()
                .map(roleItem -> roleItem.getRoleName().name())
                .orElse("");

        String status = Boolean.TRUE.equals(user.getIsActive())
                ? "Active"
                : "Inactive";

        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                s3Service.resolveAvatarUrl(user.getAvatar()),
                user.getCoverImage(),
                user.getDateOfBirth(),
                user.getGender(),
                role,
                status,
                user.getCreatedAt(),
                user.getIsDeleted(),
                user.getUpdatedAt()
        );
    }
    @Transactional
    public UserResponse updateAvatar(String email, String avatarKey) {

        User user = userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setAvatar(avatarKey);
        user.setUpdatedAt(Instant.now());

        userRepository.save(user);

        return mapToUserResponse(user);
    }
    private UserResponse mapToUserResponse(User user) {

        String role = user.getRoles().stream()
                .findFirst()
                .map(r -> r.getRoleName().name())
                .orElse("");

        String status = Boolean.TRUE.equals(user.getIsActive())
                ? "Active"
                : "Inactive";

        String avatar = s3Service.resolveAvatarUrl(user.getAvatar());

        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                avatar,
                user.getCoverImage(),
                user.getDateOfBirth(),
                user.getGender(),
                role,
                status,
                user.getCreatedAt(),
                user.getIsDeleted(),
                user.getUpdatedAt()
        );
    }
    // Reveals whether the email exists — an explicit product decision for this
    // flow (unlike resendVerificationEmail, which stays silent to avoid enumeration).
    @Transactional
    public void forgotPassword(String email) {
        User user = userRepository.findByEmailAndIsDeletedFalse(email.trim().toLowerCase())
                .orElseThrow(() -> new BusinessException("This email does not exist."));

        VerificationToken resetToken = verificationTokenService.createResetPasswordToken(user);
        String resetLink = frontendBaseUrl + "/reset-password?token=" + resetToken.getToken();

        emailService.sendResetPasswordEmail(user.getEmail(), user.getFullName(), resetLink);
    }

    @Transactional(readOnly = true)
    public void validateResetToken(String token) {
        verificationTokenService.verifyResetPasswordToken(token);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        VerificationToken resetToken = verificationTokenService.verifyResetPasswordToken(token);
        User user = resetToken.getUser();

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        verificationTokenService.markAsUsed(resetToken);
    }

    public void changePassword(String email, ChangePasswordRequest request) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Current password is incorrect");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("New password and confirm password do not match");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
