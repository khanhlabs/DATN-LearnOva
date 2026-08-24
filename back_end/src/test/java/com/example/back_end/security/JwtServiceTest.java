package com.example.back_end.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtServiceTest {
    private static final String SECRET = "learnova-test-secret-must-have-at-least-thirty-two-characters";
    private JwtService jwtService;
    private UserDetails user;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", SECRET);
        ReflectionTestUtils.setField(jwtService, "accessTokenExpiration", 60_000L);
        user = new User("student@learnova.test", "ignored", List.of());
    }

    @Test
    void generatesTokenWithAuthenticatedUserEmail() {
        String token = jwtService.generateAccessToken(user);

        assertEquals("student@learnova.test", jwtService.getEmailFromToken(token));
        assertTrue(jwtService.isTokenValid(token, user));
    }

    @Test
    void rejectsTokenForAnotherUser() {
        String token = jwtService.generateAccessToken(user);
        UserDetails anotherUser = new User("other@learnova.test", "ignored", List.of());

        assertFalse(jwtService.isTokenValid(token, anotherUser));
    }

    @Test
    void rejectsExpiredTokenWithoutThrowing() {
        ReflectionTestUtils.setField(jwtService, "accessTokenExpiration", -1L);
        String expiredToken = jwtService.generateAccessToken(user);

        assertFalse(jwtService.isTokenValid(expiredToken, user));
    }

    @Test
    void rejectsMalformedTokenWithoutThrowing() {
        assertFalse(jwtService.isTokenValid("not-a-jwt", user));
    }

    @Test
    void rejectsNullTokenWithoutThrowing() {
        assertFalse(jwtService.isTokenValid(null, user));
    }

    @Test
    void preservesMixedCaseUserEmailInGeneratedToken() {
        UserDetails teacher = new User("Teacher@LearnOva.Test", "ignored", List.of());
        String token = jwtService.generateAccessToken(teacher);

        assertEquals("Teacher@LearnOva.Test", jwtService.getEmailFromToken(token));
        assertTrue(jwtService.isTokenValid(token, teacher));
    }

    @Test
    void accessTokenExpiresWhenExpirationIsZero() {
        ReflectionTestUtils.setField(jwtService, "accessTokenExpiration", 0L);
        String token = jwtService.generateAccessToken(user);

        assertFalse(jwtService.isTokenValid(token, user));
    }
}
