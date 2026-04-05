package com.healthcare.doctor_service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class DoctorRequestDTO {

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    private String phone;

    @NotBlank(message = "Specialization is required")
    private String specialization;

    private String qualification;
    private String licenseNumber;
    private Integer experienceYears;
    private String bio;
    private String profileImageUrl;

    @NotNull(message = "Consultation fee is required")
    private Double consultationFee;

    // ── Getters ──────────────────────────────────────────────────────────────

    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getPhone() { return phone; }
    public String getSpecialization() { return specialization; }
    public String getQualification() { return qualification; }
    public String getLicenseNumber() { return licenseNumber; }
    public Integer getExperienceYears() { return experienceYears; }
    public String getBio() { return bio; }
    public String getProfileImageUrl() { return profileImageUrl; }
    public Double getConsultationFee() { return consultationFee; }

    // ── Setters ──────────────────────────────────────────────────────────────

    public void setFirstName(String firstName) { this.firstName = firstName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public void setPhone(String phone) { this.phone = phone; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }
    public void setQualification(String qualification) { this.qualification = qualification; }
    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }
    public void setExperienceYears(Integer experienceYears) { this.experienceYears = experienceYears; }
    public void setBio(String bio) { this.bio = bio; }
    public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }
    public void setConsultationFee(Double consultationFee) { this.consultationFee = consultationFee; }
}