package com.example.back_end.security;

import com.example.back_end.entity.Role;
import com.example.back_end.entity.User;
import com.example.back_end.entity.enums.RoleName;
import com.example.back_end.repository.RoleRepository;
import com.example.back_end.repository.UserRepository;
import com.example.back_end.service.CookieService;
import com.example.back_end.service.VerificationTokenService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import java.io.IOException;
import java.time.Instant;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler
        implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final JwtService jwtService;
    private final VerificationTokenService verificationTokenService;
    private final CookieService cookieService;

    @Value("${app.frontend.base-url}")
    private String frontendBaseUrl;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException, ServletException {

        OAuth2User oauthUser =
                (OAuth2User) authentication.getPrincipal();

        String registrationId =
                ((OAuth2AuthenticationToken) authentication)
                        .getAuthorizedClientRegistrationId();

        String email;
        String name;
        String picture;

        if ("google".equals(registrationId)) {

            email = oauthUser.getAttribute("email");
            name = oauthUser.getAttribute("name");
            picture = oauthUser.getAttribute("picture");

        } else if ("facebook".equals(registrationId)) {

            String facebookId = oauthUser.getAttribute("id");

            email = "fb_" + facebookId + "@facebook.local";

            name = oauthUser.getAttribute("name");

            picture =
                    "https://graph.facebook.com/"
                            + facebookId
                            + "/picture?type=large";

        } else {
            throw new RuntimeException("Unsupported provider");
        }

        User user = userRepository
                .findByEmailAndIsDeletedFalse(email)
                .orElse(null);

        if (user == null) {

            Role userRole = roleRepository
                    .findByRoleName(RoleName.ROLE_USER)
                    .orElseThrow(() ->
                            new RuntimeException("ROLE_USER not found"));

            user = new User();
            user.setEmail(email);
            user.setFullName(name);
            user.setAvatar(picture);
            user.setIsActive(true);
            user.setIsDeleted(false);
            user.setCreatedAt(Instant.now());

            user.setRoles(Set.of(userRole));

            user = userRepository.save(user);
        }

        UserDetails userDetails =
                new CustomUserDetails(user);

        String accessToken =
                jwtService.generateAccessToken(userDetails);

        String refreshToken =
                verificationTokenService
                        .createRefreshToken(email, true)
                        .getToken();

        response.addHeader(HttpHeaders.SET_COOKIE,
                cookieService.createRefreshTokenCookie(refreshToken, true).toString());
        response.addHeader(HttpHeaders.SET_COOKIE,
                cookieService.createAccessTokenCookie(accessToken).toString());

        response.sendRedirect(frontendBaseUrl + "/oauth2-success");
    }
}