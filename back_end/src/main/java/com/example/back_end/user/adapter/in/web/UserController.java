package com.example.back_end.user.adapter.in.web;

import com.example.back_end.user.adapter.in.web.dto.CurrentUserResponse;
import com.example.back_end.auth.application.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.example.back_end.user.adapter.in.web.dto.UserResponse;
import com.example.back_end.user.adapter.in.web.dto.UpdateProfileRequest;
import com.example.back_end.user.adapter.in.web.dto.UpdateAvatarRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.*;
import com.example.back_end.auth.adapter.in.web.dto.ChangePasswordRequest;
import com.example.back_end.auth.adapter.in.web.dto.SwitchRoleRequest;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/learnova")
public class UserController {

    private final AuthService authService;

    @GetMapping("/user/me")
    public ResponseEntity<CurrentUserResponse> getCurrentUser(Authentication authentication) {
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.ok(authService.getCurrentUser(authentication.getName()));
    }

    @PatchMapping("/user/active-role")
    public ResponseEntity<CurrentUserResponse> switchActiveRole(
            Authentication authentication,
            @Valid @RequestBody SwitchRoleRequest request
    ) {
        return ResponseEntity.ok(
                authService.switchActiveRole(authentication.getName(), request.role())
        );
    }

    @GetMapping("/user/profile")
    public ResponseEntity<UserResponse> getUserProfile(Authentication authentication) {

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.ok(authService.getUserProfile(authentication.getName()));
    }
    @PutMapping("/user/profile")
    public ResponseEntity<UserResponse> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        return ResponseEntity.ok(
                authService.updateProfile(authentication.getName(), request)
        );
    }


    @PostMapping("/user/avatar")
    public ResponseEntity<UserResponse> uploadAvatar(
            Authentication authentication,
            @Valid @RequestBody UpdateAvatarRequest request
    ) {

        String email = authentication.getName();

        return ResponseEntity.ok(
                authService.updateAvatar(email, request.avatarKey())
        );
    }
    @PutMapping("/user/change-password")
    public ResponseEntity<?> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request
    ) {

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        authService.changePassword(authentication.getName(), request);

        return ResponseEntity.ok("Change password successfully");
    }
}
