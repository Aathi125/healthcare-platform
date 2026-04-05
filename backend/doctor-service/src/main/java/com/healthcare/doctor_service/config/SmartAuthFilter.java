package com.healthcare.doctor_service.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

public class SmartAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public SmartAuthFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        // ── MODE 1: API Gateway headers ───────────────────────────────────────
        String userIdHeader = request.getHeader("X-User-Id");
        String roleHeader   = request.getHeader("X-User-Role");
        String emailHeader  = request.getHeader("X-User-Email");

        if (userIdHeader != null && roleHeader != null) {
            setAuthentication(Long.parseLong(userIdHeader), emailHeader, roleHeader);

        } else {
            // ── MODE 2: Direct JWT token ──────────────────────────────────────
            String authHeader = request.getHeader("Authorization");

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);

                if (jwtUtil.isTokenValid(token)) {
                    Long userId  = jwtUtil.extractUserId(token);
                    String email = jwtUtil.extractEmail(token);
                    String role  = jwtUtil.extractRole(token);
                    setAuthentication(userId, email, role);
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    private void setAuthentication(Long userId, String email, String role) {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(
                        email + "|" + userId,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
                );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }
}