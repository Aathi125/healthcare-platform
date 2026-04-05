package com.healthcare.doctor_service.dto;

import com.healthcare.doctor_service.model.Doctor.DoctorStatus;
import java.time.LocalDateTime;
import java.util.List;

public class DoctorResponseDTO {

    private Long id;
    private Long userId;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String specialization;
    private String qualification;
    private String licenseNumber;
    private Integer experienceYears;
    private String bio;
    private String profileImageUrl;
    private Double consultationFee;
    private DoctorStatus status;
    private LocalDateTime createdAt;
    private List<AvailabilityDTO> availabilities;

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
    public List<AvailabilityDTO> getAvailabilities() { return availabilities; }

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
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setAvailabilities(List<AvailabilityDTO> availabilities) { this.availabilities = availabilities; }
}