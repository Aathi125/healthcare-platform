package com.healthcare.doctor_service.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtUtil {

    // ⚠️ This secret key is TEMPORARY
    // When Auth Service is ready, JWT will be validated there
    // This must match the same secret your teammate uses in Auth Service
    private static final String SECRET =
            "healthcare_platform_super_secret_key_2024_very_long";

    private static final long EXPIRATION_MS = 86400000; // 24 hours

    private Key getKey() {
        return Keys.hmacShaKeyFor(SECRET.getBytes());
    }

    // ── Generate a token (for testing only) ──────────────────────────────────
    public String generateToken(Long userId, String email, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("email", email);
        claims.put("role", role);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_MS))
                .signWith(getKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // ── Read userId from token ────────────────────────────────────────────────
    public Long extractUserId(String token) {
        Claims claims = getClaims(token);
        return ((Number) claims.get("userId")).longValue();
    }

    // ── Read email from token ─────────────────────────────────────────────────
    public String extractEmail(String token) {
        return getClaims(token).getSubject();
    }

    // ── Read role from token ──────────────────────────────────────────────────
    public String extractRole(String token) {
        return (String) getClaims(token).get("role");
    }

    // ── Check token is not expired ────────────────────────────────────────────
    public boolean isTokenValid(String token) {
        try {
            return !getClaims(token).getExpiration().before(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}