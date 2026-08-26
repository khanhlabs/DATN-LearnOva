package com.example.back_end.shared.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import com.example.back_end.security.OAuth2AuthenticationSuccessHandler;
import org.springframework.http.HttpMethod;
import com.example.back_end.security.CustomUserDetailsService;
import com.example.back_end.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;


@Configuration
@RequiredArgsConstructor
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomUserDetailsService customUserDetailsService;
    private final OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;

    @Autowired(required = false)
    private ClientRegistrationRepository clientRegistrationRepository;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                .authorizeHttpRequests(auth -> auth
                        // ── Public: no authentication required ──────────────
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/learnova/auth/**").permitAll()
                        .requestMatchers("/api/learnova/courses/video-url/**").permitAll()
                        .requestMatchers("/api/learnova/courses/hls/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/learnova/courses/public/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/learnova/courses/featured").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/learnova/courses/stats").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/learnova/courses/top-categories").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/learnova/courses/categories").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/learnova/courses/voice-search").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/learnova/instructors/public/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/learnova/chatbot/message").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/learnova/chatbot/message/stream").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/learnova/courses/*").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/learnova/enrollments/check").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/learnova/course/*").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/learnova/review/summary/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/learnova/instructors/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/learnova/search").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/learnova/review/testimonials").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/qna/course/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/learnova/qna/lesson/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/learnova/certificates/verify/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/learnova/payments/webhook").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/learnova/payments/exchange-rate/usd-vnd").permitAll()
                        .requestMatchers("/api/learnova/user/me").permitAll()
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers("/error").permitAll()

                        // ── Admin only ────────────────────────────────────────
                        .requestMatchers("/api/learnova/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )

                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json");
                            response.getWriter().write("{\"error\":\"Unauthorized\"}");
                        })
                );

        if (clientRegistrationRepository != null) {
            http.oauth2Login(oauth2 -> oauth2
                    .successHandler(oAuth2AuthenticationSuccessHandler)
            );
        }

        return http
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                )
                .build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(customUserDetailsService);

        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }
}
