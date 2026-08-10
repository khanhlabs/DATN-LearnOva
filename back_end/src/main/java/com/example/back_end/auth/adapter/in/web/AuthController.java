package com.example.back_end.auth.adapter.in.web;

import com.example.back_end.auth.adapter.in.web.dto.AuthTokenResponse;
import com.example.back_end.auth.adapter.in.web.dto.LoginResponse;
import com.example.back_end.auth.adapter.in.web.dto.LoginRequest;
import com.example.back_end.auth.application.AuthService;
import com.example.back_end.auth.application.CookieService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.back_end.auth.adapter.in.web.dto.RegisterRequest;
import com.example.back_end.auth.adapter.in.web.dto.RegisterResponse;
import com.example.back_end.auth.adapter.in.web.dto.ResendVerificationRequest;
import com.example.back_end.auth.adapter.in.web.dto.ForgotPasswordRequest;
import com.example.back_end.auth.adapter.in.web.dto.ResetPasswordRequest;


@RestController
@RequiredArgsConstructor
@RequestMapping("/api/learnova/auth")
public class AuthController {

    private final AuthService authService;
    private final CookieService cookieService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response
    ) {
        AuthTokenResponse result = authService.login(request);
        response.addHeader(HttpHeaders.SET_COOKIE,
                cookieService.createRefreshTokenCookie(result.refreshToken(), request.rememberMe()).toString());
        response.addHeader(HttpHeaders.SET_COOKIE,
                cookieService.createAccessTokenCookie(result.accessToken()).toString());
        return ResponseEntity.ok(new LoginResponse(result.accessToken()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(
            @CookieValue(value = "refreshToken", required = false) String refreshToken,
            HttpServletResponse response
    ) {
        if (refreshToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        try {
            AuthTokenResponse result = authService.refreshAccessToken(refreshToken);
            // Both cookies are rotated: refresh token is replaced, access token is renewed.
            response.addHeader(HttpHeaders.SET_COOKIE,
                    cookieService.createRefreshTokenCookie(result.refreshToken(), false).toString());
            response.addHeader(HttpHeaders.SET_COOKIE,
                    cookieService.createAccessTokenCookie(result.accessToken()).toString());
            return ResponseEntity.ok(new LoginResponse(result.accessToken()));
        } catch (RuntimeException e) {
            response.addHeader(HttpHeaders.SET_COOKIE, cookieService.clearRefreshTokenCookie().toString());
            response.addHeader(HttpHeaders.SET_COOKIE, cookieService.clearAccessTokenCookie().toString());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(value = "refreshToken", required = false) String refreshToken,
            HttpServletResponse response
    ) {
        authService.logout(refreshToken);
        response.addHeader(HttpHeaders.SET_COOKIE, cookieService.clearRefreshTokenCookie().toString());
        response.addHeader(HttpHeaders.SET_COOKIE, cookieService.clearAccessTokenCookie().toString());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(
            @Valid @RequestBody RegisterRequest request
    ) {
        authService.register(request);
        return ResponseEntity.ok(new RegisterResponse(
                true,
                "Registration successful. Please check your email to verify your account."
        ));
    }

    @GetMapping("/verify")
    public ResponseEntity<RegisterResponse> verifyAccount(@RequestParam("token") String token) {
        authService.verifyEmail(token);
        return ResponseEntity.ok(new RegisterResponse(
                true,
                "Your account has been activated successfully! You can now log in."
        ));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<RegisterResponse> resendVerification(
            @Valid @RequestBody ResendVerificationRequest request
    ) {
        authService.resendVerificationEmail(request.getEmail());
        // Always return success — do not reveal whether the email is registered.
        return ResponseEntity.ok(new RegisterResponse(
                true,
                "If that email is registered and unverified, a verification link has been sent."
        ));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<RegisterResponse> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request
    ) {
        authService.forgotPassword(request.getEmail());
        return ResponseEntity.ok(new RegisterResponse(
                true,
                "A password reset link has been sent to your email."
        ));
    }

    @GetMapping("/validate-reset-token")
    public ResponseEntity<RegisterResponse> validateResetToken(@RequestParam("token") String token) {
        authService.validateResetToken(token);
        return ResponseEntity.ok(new RegisterResponse(true, "Token is valid."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<RegisterResponse> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request
    ) {
        authService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(new RegisterResponse(
                true,
                "Password has been changed successfully."
        ));
    }
}
