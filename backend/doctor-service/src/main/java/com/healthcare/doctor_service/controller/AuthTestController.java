package com.healthcare.doctor_service.controller;

import com.healthcare.doctor_service.config.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

// ⚠️ TEMPORARY — DELETE WHEN AUTH SERVICE IS READY
@RestController
@RequestMapping("/api/auth-test")
@CrossOrigin(origins = "*")
public class AuthTestController {

    private final JwtUtil jwtUtil;

    public AuthTestController(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/token")
    public ResponseEntity<Map<String, String>> getTestToken(
            @RequestBody Map<String, Object> body) {

        Long userId  = ((Number) body.get("userId")).longValue();
        String email = (String) body.get("email");
        String role  = (String) body.get("role");

        String token = jwtUtil.generateToken(userId, email, role);

        return ResponseEntity.ok(Map.of(
                "token", token,
                "message", "Copy the token and use it in Authorization header"
        ));
    }
}