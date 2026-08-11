package com.example.back_end.admin.application;
import com.example.back_end.instructor.application.TeacherApplicationService;

import com.example.back_end.media.adapter.in.web.dto.CvUrlResponse;
import com.example.back_end.instructor.adapter.in.web.dto.TeacherApplicationResponse;
import com.example.back_end.instructor.domain.InstructorProfile;
import com.example.back_end.auth.domain.Role;
import com.example.back_end.instructor.domain.TeacherApplication;
import com.example.back_end.auth.domain.User;
import com.example.back_end.notification.domain.enums.NotificationType;
import com.example.back_end.auth.domain.enums.RoleName;
import com.example.back_end.instructor.domain.enums.TeacherApplicationStatus;
import com.example.back_end.shared.exception.BusinessException;
import com.example.back_end.shared.exception.ResourceNotFoundException;
import com.example.back_end.instructor.infrastructure.persistence.InstructorProfileRepository;
import com.example.back_end.auth.infrastructure.persistence.RoleRepository;
import com.example.back_end.instructor.infrastructure.persistence.TeacherApplicationRepository;
import com.example.back_end.auth.infrastructure.persistence.UserRepository;
import com.example.back_end.auth.infrastructure.EmailService;
import com.example.back_end.notification.application.NotificationService;
import com.example.back_end.media.infrastructure.storage.S3Service;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/** Admin-side review of teacher applications (list/approve/reject). The applicant-facing submit/track flow lives in service.teacher.TeacherApplicationService. */
@Service
@RequiredArgsConstructor
@Transactional
public class AdminTeacherApplicationService {

    private static final Logger log = LoggerFactory.getLogger(AdminTeacherApplicationService.class);

    private final TeacherApplicationRepository teacherApplicationRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final InstructorProfileRepository instructorProfileRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final S3Service s3Service;

    @Transactional(readOnly = true)
    public List<TeacherApplicationResponse> listPending() {
        return teacherApplicationRepository.findAllByStatusOrderByCreatedAtAsc(TeacherApplicationStatus.PENDING).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TeacherApplicationResponse getById(Long id) {
        TeacherApplication application = teacherApplicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found id=" + id));
        return toResponse(application);
    }

    @Transactional(readOnly = true)
    public CvUrlResponse getCvUrl(Long id) {
        TeacherApplication application = teacherApplicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found id=" + id));

        return new CvUrlResponse(s3Service.generateCloudFrontSignedUrl(application.getCvKey()));
    }

    public TeacherApplicationResponse approve(Long id) {
        TeacherApplication application = teacherApplicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found id=" + id));

        if (application.getStatus() != TeacherApplicationStatus.PENDING) {
            throw new BusinessException("Chỉ có thể duyệt đơn đang ở trạng thái PENDING.");
        }

        application.setStatus(TeacherApplicationStatus.APPROVED);
        application.setReviewedAt(Instant.now());
        teacherApplicationRepository.save(application);

        User user = application.getUser();
        Role teacherRole = roleRepository.findByRoleName(RoleName.ROLE_TEACHER)
                .orElseThrow(() -> new ResourceNotFoundException("Role ROLE_TEACHER not found"));
        if (user.getRoles().stream().noneMatch(role -> role.getRoleName() == RoleName.ROLE_TEACHER)) {
            user.getRoles().add(teacherRole);
        }
        boolean isAdmin = user.getRoles().stream()
                .anyMatch(role -> role.getRoleName() == RoleName.ROLE_ADMIN);
        if (!isAdmin) {
            user.setActiveRole(RoleName.ROLE_TEACHER);
        }
        userRepository.save(user);

        seedInstructorProfile(user, application);

        notifyApplicant(
                application,
                NotificationType.TEACHER_APPLICATION_APPROVED,
                "Instructor application approved",
                "Your application to become an instructor has been approved.",
                () -> emailService.sendTeacherApplicationApprovedEmail(user.getEmail(), user.getFullName())
        );

        return toResponse(application);
    }

    public TeacherApplicationResponse reject(Long id, String reason) {
        TeacherApplication application = teacherApplicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found id=" + id));

        if (application.getStatus() != TeacherApplicationStatus.PENDING) {
            throw new BusinessException("Chỉ có thể từ chối đơn đang ở trạng thái PENDING.");
        }

        application.setStatus(TeacherApplicationStatus.REJECTED);
        application.setRejectionReason(reason);
        application.setReviewedAt(Instant.now());
        teacherApplicationRepository.save(application);

        notifyApplicant(
                application,
                NotificationType.TEACHER_APPLICATION_REJECTED,
                "Instructor application rejected",
                "Your application to become an instructor was rejected. Reason: " + reason,
                () -> emailService.sendTeacherApplicationRejectedEmail(
                        application.getUser().getEmail(), application.getUser().getFullName(), reason)
        );

        return toResponse(application);
    }

    /** Seeds a starter public instructor profile from the approved application, unless one already exists. */
    private void seedInstructorProfile(User user, TeacherApplication application) {
        if (instructorProfileRepository.existsById(user.getId())) {
            return;
        }

        InstructorProfile profile = new InstructorProfile();
        profile.setUser(user);
        profile.setExpertise(application.getSpecialization());
        profile.setDescription(application.getExperience());
        profile.setCreatedAt(Instant.now());
        profile.setUpdatedAt(Instant.now());
        instructorProfileRepository.save(profile);
    }

    private void notifyApplicant(TeacherApplication application, NotificationType type, String title, String content, Runnable sendEmail) {
        notificationService.create(
                application.getUser(),
                type,
                title,
                content,
                "/learnova/user/profile",
                Map.of("applicationId", application.getId())
        );

        try {
            sendEmail.run();
        } catch (Exception e) {
            log.error("Failed to send teacher application status email for application id={}", application.getId(), e);
        }
    }

    private TeacherApplicationResponse toResponse(TeacherApplication application) {
        User user = application.getUser();
        return new TeacherApplicationResponse(
                application.getId(),
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getAvatar(),
                application.getSpecialization(),
                application.getExperience(),
                application.getCvKey(),
                application.getStatus().name(),
                application.getRejectionReason(),
                application.getCreatedAt(),
                application.getReviewedAt()
        );
    }
}
