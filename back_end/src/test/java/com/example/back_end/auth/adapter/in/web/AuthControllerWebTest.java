package com.example.back_end.auth.adapter.in.web;

import com.example.back_end.auth.adapter.in.web.dto.AuthTokenResponse;
import com.example.back_end.auth.application.AuthService;
import com.example.back_end.auth.application.CookieService;
import com.example.back_end.shared.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseCookie;
import org.springframework.http.MediaType;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuthControllerWebTest {

    private MockMvc mockMvc;

    @Mock
    private AuthService authService;

    @Mock
    private CookieService cookieService;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new AuthController(authService, cookieService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void login_withValidRequest_returnsTokenAndCookies() throws Exception {
        when(authService.login(any())).thenReturn(new AuthTokenResponse("access-token", "refresh-token"));
        when(cookieService.createAccessTokenCookie("access-token"))
                .thenReturn(ResponseCookie.from("accessToken", "access-token").path("/").build());
        when(cookieService.createRefreshTokenCookie("refresh-token", false))
                .thenReturn(ResponseCookie.from("refreshToken", "refresh-token").path("/api/learnova/auth").build());

        mockMvc.perform(post("/api/learnova/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"student@learnova.test\",\"password\":\"secret\",\"rememberMe\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("access-token"))
                .andExpect(header().exists("Set-Cookie"));

        verify(authService).login(any());
    }

    @Test
    void register_withInvalidEmail_returnsValidationError() throws Exception {
        mockMvc.perform(post("/api/learnova/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Test Student\",\"email\":\"not-an-email\",\"password\":\"secret\",\"confirmPassword\":\"secret\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Email must be a valid email address"));
    }
}
