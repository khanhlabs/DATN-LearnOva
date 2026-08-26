package com.example.back_end.auth.application;

import com.example.back_end.auth.adapter.in.web.dto.RegisterRequest;
import com.example.back_end.auth.adapter.in.web.dto.LoginRequest;
import com.example.back_end.auth.adapter.in.web.dto.AuthTokenResponse;
import com.example.back_end.auth.domain.Role;
import com.example.back_end.auth.domain.User;
import com.example.back_end.auth.domain.VerificationToken;
import com.example.back_end.auth.domain.enums.RoleName;
import com.example.back_end.auth.infrastructure.EmailService;
import com.example.back_end.auth.infrastructure.persistence.RoleRepository;
import com.example.back_end.auth.infrastructure.persistence.UserRepository;
import com.example.back_end.media.infrastructure.storage.S3Service;
import com.example.back_end.security.CustomUserDetailsService;
import com.example.back_end.security.JwtService;
import com.example.back_end.shared.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtService jwtService;
    @Mock private VerificationTokenService verificationTokenService;
    @Mock private CustomUserDetailsService customUserDetailsService;
    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private EmailService emailService;
    @Mock private S3Service s3Service;
    @InjectMocks private AuthService authService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "frontendBaseUrl", "http://localhost:5173");
    }

    @Test
    void registerNormalizesEmailAndSendsVerificationLink() {
        Role role = new Role();
        role.setRoleName(RoleName.ROLE_USER);
        VerificationToken token = new VerificationToken();
        token.setToken("verification-token");
        when(userRepository.existsUsersByEmail("Student@LearnOva.Test")).thenReturn(false);
        when(roleRepository.findByRoleName(RoleName.ROLE_USER)).thenReturn(Optional.of(role));
        when(passwordEncoder.encode("secret1")).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(verificationTokenService.createActiveAccountToken(any(User.class))).thenReturn(token);

        authService.register(new RegisterRequest("  Student  ", "Student@LearnOva.Test", "secret1", "secret1"));

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertEquals("student@learnova.test", userCaptor.getValue().getEmail());
        assertEquals("Student", userCaptor.getValue().getFullName());
        verify(emailService).sendVerificationEmail(
                anyString(), anyString(), org.mockito.ArgumentMatchers.contains("token=verification-token"));
    }

    @Test
    void registerRejectsAnExistingEmail() {
        when(userRepository.existsUsersByEmail("student@learnova.test")).thenReturn(true);

        assertThrows(BusinessException.class, () -> authService.register(
                new RegisterRequest("Student", "student@learnova.test", "secret1", "secret1")));
        verify(userRepository, never()).save(any());
    }

    @Test
    void registerRejectsShortPassword() {
        when(userRepository.existsUsersByEmail("student@learnova.test")).thenReturn(false);

        assertThrows(BusinessException.class, () -> authService.register(
                new RegisterRequest("Student", "student@learnova.test", "12345", "12345")));
        verify(userRepository, never()).save(any());
    }

    @Test
    void registerRejectsMismatchedPasswordConfirmation() {
        when(userRepository.existsUsersByEmail("student@learnova.test")).thenReturn(false);

        assertThrows(BusinessException.class, () -> authService.register(
                new RegisterRequest("Student", "student@learnova.test", "secret1", "secret2")));
        verify(userRepository, never()).save(any());
    }

    @Test
    void registerRejectsWhenDefaultRoleIsMissing() {
        when(userRepository.existsUsersByEmail("student@learnova.test")).thenReturn(false);
        when(roleRepository.findByRoleName(RoleName.ROLE_USER)).thenReturn(Optional.empty());

        assertThrows(BusinessException.class, () -> authService.register(
                new RegisterRequest("Student", "student@learnova.test", "secret1", "secret1")));
        verify(userRepository, never()).save(any());
    }

    @Test
    void loginNormalizesEmailAndReturnsAccessAndRefreshTokens() {
        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                "student@learnova.test", "ignored", java.util.List.of());
        Authentication authentication = org.mockito.Mockito.mock(Authentication.class);
        VerificationToken refreshToken = new VerificationToken();
        refreshToken.setToken("refresh-token");
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(jwtService.generateAccessToken(userDetails)).thenReturn("access-token");
        when(verificationTokenService.createRefreshToken("student@learnova.test", true)).thenReturn(refreshToken);

        AuthTokenResponse result = authService.login(new LoginRequest(" Student@LearnOva.Test ", "secret1", true));

        assertEquals("access-token", result.accessToken());
        assertEquals("refresh-token", result.refreshToken());
    }

    @Test
    void logoutWithoutTokenDoesNotCallDependencies() {
        authService.logout(null);

        verifyNoInteractions(verificationTokenService);
    }

    @Test
    void resendVerificationDoesNothingForUnknownEmail() {
        when(userRepository.findByEmailAndIsDeletedFalse("unknown@learnova.test")).thenReturn(Optional.empty());

        authService.resendVerificationEmail(" Unknown@LearnOva.Test ");

        verify(emailService, never()).sendVerificationEmail(anyString(), anyString(), anyString());
    }
}
