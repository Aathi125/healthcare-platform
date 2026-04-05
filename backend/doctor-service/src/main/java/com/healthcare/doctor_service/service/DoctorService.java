package com.healthcare.doctor_service.service;

import com.healthcare.doctor_service.dto.AvailabilityDTO;
import com.healthcare.doctor_service.dto.DoctorRequestDTO;
import com.healthcare.doctor_service.dto.DoctorResponseDTO;
import com.healthcare.doctor_service.model.Doctor;
import com.healthcare.doctor_service.model.Doctor.DoctorStatus;
import com.healthcare.doctor_service.model.DoctorAvailability;
import com.healthcare.doctor_service.repository.DoctorAvailabilityRepository;
import com.healthcare.doctor_service.repository.DoctorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final DoctorAvailabilityRepository availabilityRepository;

    // Manual constructor instead of @RequiredArgsConstructor
    public DoctorService(DoctorRepository doctorRepository,
                         DoctorAvailabilityRepository availabilityRepository) {
        this.doctorRepository = doctorRepository;
        this.availabilityRepository = availabilityRepository;
    }

    public DoctorResponseDTO createDoctorProfile(Long userId, String email,
                                                 DoctorRequestDTO dto) {
        if (doctorRepository.existsByUserId(userId)) {
            throw new RuntimeException("Doctor profile already exists for this user");
        }
        Doctor doctor = new Doctor();
        doctor.setUserId(userId);
        doctor.setEmail(email);
        mapDtoToDoctor(dto, doctor);
        Doctor saved = doctorRepository.save(doctor);
        return mapToResponseDTO(saved);
    }

    public DoctorResponseDTO getDoctorById(Long id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Doctor not found with id: " + id));
        return mapToResponseDTO(doctor);
    }

    public DoctorResponseDTO getDoctorByUserId(Long userId) {
        Doctor doctor = doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Doctor not found for userId: " + userId));
        return mapToResponseDTO(doctor);
    }

    public List<DoctorResponseDTO> getAllVerifiedDoctors() {
        return doctorRepository.findByStatus(DoctorStatus.VERIFIED)
                .stream().map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public List<DoctorResponseDTO> searchBySpecialization(String specialization) {
        return doctorRepository
                .findBySpecializationContainingIgnoreCaseAndStatus(
                        specialization, DoctorStatus.VERIFIED)
                .stream().map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public DoctorResponseDTO updateDoctorProfile(Long userId, DoctorRequestDTO dto) {
        Doctor doctor = doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        mapDtoToDoctor(dto, doctor);
        return mapToResponseDTO(doctorRepository.save(doctor));
    }

    public DoctorResponseDTO verifyDoctor(Long doctorId) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        doctor.setStatus(DoctorStatus.VERIFIED);
        return mapToResponseDTO(doctorRepository.save(doctor));
    }

    public DoctorResponseDTO rejectDoctor(Long doctorId) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        doctor.setStatus(DoctorStatus.REJECTED);
        return mapToResponseDTO(doctorRepository.save(doctor));
    }

    public List<DoctorResponseDTO> getPendingDoctors() {
        return doctorRepository.findByStatus(DoctorStatus.PENDING)
                .stream().map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<AvailabilityDTO> setAvailability(Long userId,
                                                 List<AvailabilityDTO> slots) {
        Doctor doctor = doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        availabilityRepository.deleteByDoctorId(doctor.getId());

        List<DoctorAvailability> entities = slots.stream().map(slot -> {
            DoctorAvailability av = new DoctorAvailability();
            av.setDoctor(doctor);
            av.setDayOfWeek(slot.getDayOfWeek());
            av.setStartTime(slot.getStartTime());
            av.setEndTime(slot.getEndTime());
            av.setSlotDurationMinutes(
                    slot.getSlotDurationMinutes() != null ? slot.getSlotDurationMinutes() : 30
            );
            av.setIsAvailable(true);
            return av;
        }).collect(Collectors.toList());

        List<DoctorAvailability> saved = availabilityRepository.saveAll(entities);
        return saved.stream().map(this::mapAvailability).collect(Collectors.toList());
    }

    public List<AvailabilityDTO> getAvailability(Long doctorId) {
        return availabilityRepository.findByDoctorId(doctorId)
                .stream().map(this::mapAvailability)
                .collect(Collectors.toList());
    }

    private void mapDtoToDoctor(DoctorRequestDTO dto, Doctor doctor) {
        doctor.setFirstName(dto.getFirstName());
        doctor.setLastName(dto.getLastName());
        doctor.setPhone(dto.getPhone());
        doctor.setSpecialization(dto.getSpecialization());
        doctor.setQualification(dto.getQualification());
        doctor.setLicenseNumber(dto.getLicenseNumber());
        doctor.setExperienceYears(dto.getExperienceYears());
        doctor.setBio(dto.getBio());
        doctor.setProfileImageUrl(dto.getProfileImageUrl());
        doctor.setConsultationFee(dto.getConsultationFee());
    }

    private DoctorResponseDTO mapToResponseDTO(Doctor doctor) {
        DoctorResponseDTO dto = new DoctorResponseDTO();
        dto.setId(doctor.getId());
        dto.setUserId(doctor.getUserId());
        dto.setFirstName(doctor.getFirstName());
        dto.setLastName(doctor.getLastName());
        dto.setEmail(doctor.getEmail());
        dto.setPhone(doctor.getPhone());
        dto.setSpecialization(doctor.getSpecialization());
        dto.setQualification(doctor.getQualification());
        dto.setLicenseNumber(doctor.getLicenseNumber());
        dto.setExperienceYears(doctor.getExperienceYears());
        dto.setBio(doctor.getBio());
        dto.setProfileImageUrl(doctor.getProfileImageUrl());
        dto.setConsultationFee(doctor.getConsultationFee());
        dto.setStatus(doctor.getStatus());
        dto.setCreatedAt(doctor.getCreatedAt());
        if (doctor.getAvailabilities() != null) {
            dto.setAvailabilities(
                    doctor.getAvailabilities().stream()
                            .map(this::mapAvailability)
                            .collect(Collectors.toList())
            );
        }
        return dto;
    }

    private AvailabilityDTO mapAvailability(DoctorAvailability av) {
        AvailabilityDTO dto = new AvailabilityDTO();
        dto.setId(av.getId());
        dto.setDayOfWeek(av.getDayOfWeek());
        dto.setStartTime(av.getStartTime());
        dto.setEndTime(av.getEndTime());
        dto.setSlotDurationMinutes(av.getSlotDurationMinutes());
        dto.setIsAvailable(av.getIsAvailable());
        return dto;
    }
}