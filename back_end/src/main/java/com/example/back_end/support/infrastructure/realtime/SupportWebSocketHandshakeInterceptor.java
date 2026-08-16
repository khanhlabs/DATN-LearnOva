package com.example.back_end.support.infrastructure.realtime;

import com.example.back_end.security.CustomUserDetailsService;
import com.example.back_end.security.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class SupportWebSocketHandshakeInterceptor implements HandshakeInterceptor {
    public static final String EMAIL_ATTRIBUTE = "supportEmail";

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes) {
        if (!(request instanceof org.springframework.http.server.ServletServerHttpRequest servletRequest)) {
            return false;
        }

        HttpServletRequest httpRequest = servletRequest.getServletRequest();
        String token = httpRequest.getParameter("token");
        if (token == null || token.isBlank()) return false;

        try {
            String email = jwtService.getEmailFromToken(token);
            var userDetails = userDetailsService.loadUserByUsername(email);
            if (!jwtService.isTokenValid(token, userDetails)) return false;
            attributes.put(EMAIL_ATTRIBUTE, email);
            return true;
        } catch (RuntimeException exception) {
            return false;
        }
    }

    @Override
    public void afterHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception) {
        // No-op.
    }
}
