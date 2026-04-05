package com.healthcare.doctor_service.dto;

import java.time.LocalTime;

public class AvailabilityDTO {

    private Long id;
    private Integer dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer slotDurationMinutes;
    private Boolean isAvailable;

    // ── Getters ──────────────────────────────────────────────────────────────

    public Long getId() { return id; }
    public Integer getDayOfWeek() { return dayOfWeek; }
    public LocalTime getStartTime() { return startTime; }
    public LocalTime getEndTime() { return endTime; }
    public Integer getSlotDurationMinutes() { return slotDurationMinutes; }
    public Boolean getIsAvailable() { return isAvailable; }

    // ── Setters ──────────────────────────────────────────────────────────────

    public void setId(Long id) { this.id = id; }
    public void setDayOfWeek(Integer dayOfWeek) { this.dayOfWeek = dayOfWeek; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
    public void setSlotDurationMinutes(Integer slotDurationMinutes) { this.slotDurationMinutes = slotDurationMinutes; }
    public void setIsAvailable(Boolean isAvailable) { this.isAvailable = isAvailable; }
}