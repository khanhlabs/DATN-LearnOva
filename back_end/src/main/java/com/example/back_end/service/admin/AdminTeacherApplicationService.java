package com.example.back_end.service.admin;

import com.example.back_end.dto.response.CvUrlResponse;
import com.example.back_end.dto.response.teacher.TeacherApplicationResponse;
import com.example.back_end.entity.InstructorProfile;
import com.example.back_end.entity.Role;
import com.example.back_end.entity.TeacherApplication;
import com.example.back_end.entity.User;
import com.example.back_end.entity.enums.NotificationType;
import com.example.back_end.entity.enums.RoleName;
import com.example.back_end.entity.enums.TeacherApplicationStatus;
import com.example.back_end.exception.BusinessException;
import com.example.back_end.exception.ResourceNotFoundException;
import com.example.back_end.repository.InstructorProfileRepository;
import com.example.back_end.repository.RoleRepository;
import com.example.back_end.repository.TeacherApplicationRepository;
import com.example.back_end.repository.UserRepository;
import com.example.back_end.service.EmailService;
import com.example.back_end.service.NotificationService;
import com.example.back_end.service.S3Service;
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
