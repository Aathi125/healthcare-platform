package com.healthcare.doctor_service.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "doctors")
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(nullable = false, unique = true)
    private String email;

    private String phone;

    @Column(nullable = false)
    private String specialization;

    private String qualification;

    private String licenseNumber;

    private Integer experienceYears;

    @Column(columnDefinition = "TEXT")
    private String bio;

    private String profileImageUrl;

    private Double consultationFee;

    @Enumerated(EnumType.STRING)
    private DoctorStatus status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "doctor", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<DoctorAvailability> availabilities;

    public enum DoctorStatus {
        PENDING, VERIFIED, REJECTED, INACTIVE
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = DoctorStatus.PENDING;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ── Getters ──────────────────────────────────────────────────────────────

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public String getSpecialization() { return specialization; }
    public String getQualification() { return qualification; }
    public String getLicenseNumber() { return licenseNumber; }
    public Integer getExperienceYears() { return experienceYears; }
    public String getBio() { return bio; }
    public String getProfileImageUrl() { return profileImageUrl; }
    public Double getConsultationFee() { return consultationFee; }
    public DoctorStatus getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public List<DoctorAvailability> getAvailabilities() { return availabilities; }

    // ── Setters ──────────────────────────────────────────────────────────────

    public void setId(Long id) { this.id = id; }
    public void setUserId(Long userId) { this.userId = userId; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public void setEmail(String email) { this.email = email; }
    public void setPhone(String phone) { this.phone = phone; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }
    public void setQualification(String qualification) { this.qualification = qualification; }
    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }
    public void setExperienceYears(Integer experienceYears) { this.experienceYears = experienceYears; }
    public void setBio(String bio) { this.bio = bio; }
    public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }
    public void setConsultationFee(Double consultationFee) { this.consultationFee = consultationFee; }
    public void setStatus(DoctorStatus status) { this.status = status; }
    public void setAvailabilities(List<DoctorAvailability> availabilities) { this.availabilities = availabilities; }
}