package com.example.back_end.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CertificateRepository extends JpaRepository<Certificate, Long> {

    Optional<Certificate> findByUserIdAndCourseId(Long userId, Long courseId);

    Optional<Certificate> findByCertificateCode(String certificateCode);

    List<Certificate> findByUserId(Long userId);
}
