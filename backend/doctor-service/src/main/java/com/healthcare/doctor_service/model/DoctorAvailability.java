package com.healthcare.doctor_service.model;

import jakarta.persistence.*;
import java.time.LocalTime;

@Entity
@Table(name = "doctor_availability")
public class DoctorAvailability {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @Column(nullable = false)
    private Integer dayOfWeek;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    private Integer slotDurationMinutes = 30;

    private Boolean isAvailable = true;

    // ── Getters ──────────────────────────────────────────────────────────────

    public Long getId() { return id; }
    public Doctor getDoctor() { return doctor; }
    public Integer getDayOfWeek() { return dayOfWeek; }
    public LocalTime getStartTime() { return startTime; }
    public LocalTime getEndTime() { return endTime; }
    public Integer getSlotDurationMinutes() { return slotDurationMinutes; }
    public Boolean getIsAvailable() { return isAvailable; }

    // ── Setters ──────────────────────────────────────────────────────────────

    public void setId(Long id) { this.id = id; }
    public void setDoctor(Doctor doctor) { this.doctor = doctor; }
    public void setDayOfWeek(Integer dayOfWeek) { this.dayOfWeek = dayOfWeek; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
    public void setSlotDurationMinutes(Integer slotDurationMinutes) { this.slotDurationMinutes = slotDurationMinutes; }
    public void setIsAvailable(Boolean isAvailable) { this.isAvailable = isAvailable; }
}