package com.healthcare.doctor_service.repository;

import com.healthcare.doctor_service.model.Doctor;
import com.healthcare.doctor_service.model.Doctor.DoctorStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    Optional<Doctor> findByEmail(String email);

    Optional<Doctor> findByUserId(Long userId);

    List<Doctor> findByStatus(DoctorStatus status);

    List<Doctor> findBySpecializationContainingIgnoreCaseAndStatus(
            String specialization, DoctorStatus status
    );

    boolean existsByEmail(String email);

    boolean existsByUserId(Long userId);
}