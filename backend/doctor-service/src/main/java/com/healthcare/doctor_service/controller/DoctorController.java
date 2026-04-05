package com.healthcare.doctor_service.controller;

import com.healthcare.doctor_service.dto.AvailabilityDTO;
import com.healthcare.doctor_service.dto.DoctorRequestDTO;
import com.healthcare.doctor_service.dto.DoctorResponseDTO;
import com.healthcare.doctor_service.service.DoctorService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
@CrossOrigin(origins = "*")
public class DoctorController {

    private final DoctorService doctorService;

    public DoctorController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    @PostMapping("/profile")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<DoctorResponseDTO> createProfile(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @Valid @RequestBody DoctorRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(doctorService.createDoctorProfile(
                        getCurrentUserId(userId), getCurrentEmail(email), dto));
    }

    @GetMapping
    public ResponseEntity<List<DoctorResponseDTO>> getAllDoctors() {
        return ResponseEntity.ok(doctorService.getAllVerifiedDoctors());
    }

    @GetMapping("/search")
    public ResponseEntity<List<DoctorResponseDTO>> searchDoctors(
            @RequestParam String specialization) {
        return ResponseEntity.ok(doctorService.searchBySpecialization(specialization));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DoctorResponseDTO> getDoctorById(@PathVariable Long id) {
        return ResponseEntity.ok(doctorService.getDoctorById(id));
    }

    @GetMapping("/my-profile")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<DoctorResponseDTO> getMyProfile(
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        return ResponseEntity.ok(doctorService.getDoctorByUserId(getCurrentUserId(userId)));
    }

    @PutMapping("/my-profile")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<DoctorResponseDTO> updateMyProfile(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @Valid @RequestBody DoctorRequestDTO dto) {
        return ResponseEntity.ok(doctorService.updateDoctorProfile(getCurrentUserId(userId), dto));
    }

    @PostMapping("/availability")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<List<AvailabilityDTO>> setAvailability(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestBody List<AvailabilityDTO> slots) {
        return ResponseEntity.ok(doctorService.setAvailability(getCurrentUserId(userId), slots));
    }

    @GetMapping("/{id}/availability")
    public ResponseEntity<List<AvailabilityDTO>> getAvailability(@PathVariable Long id) {
        return ResponseEntity.ok(doctorService.getAvailability(id));
    }

    @GetMapping("/admin/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<DoctorResponseDTO>> getPendingDoctors() {
        return ResponseEntity.ok(doctorService.getPendingDoctors());
    }

    @PutMapping("/admin/{id}/verify")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DoctorResponseDTO> verifyDoctor(@PathVariable Long id) {
        return ResponseEntity.ok(doctorService.verifyDoctor(id));
    }

    @PutMapping("/admin/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DoctorResponseDTO> rejectDoctor(@PathVariable Long id) {
        return ResponseEntity.ok(doctorService.rejectDoctor(id));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Long getCurrentUserId(Long headerUserId) {
        if (headerUserId != null) return headerUserId;
        String principal = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return Long.parseLong(principal.split("\\|")[1]);
    }

    private String getCurrentEmail(String headerEmail) {
        if (headerEmail != null) return headerEmail;
        String principal = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return principal.split("\\|")[0];
    }
}