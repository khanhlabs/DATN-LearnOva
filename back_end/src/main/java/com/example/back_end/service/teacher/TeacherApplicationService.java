package com.example.back_end.service.teacher;

import com.example.back_end.service.NotificationService;
import com.example.back_end.service.S3Service;

import com.example.back_end.dto.request.teacher.CreateTeacherApplicationRequest;
import com.example.back_end.dto.response.CvUrlResponse;
import com.example.back_end.dto.response.teacher.TeacherApplicationResponse;
import com.example.back_end.entity.TeacherApplication;
import com.example.back_end.entity.User;
import com.example.back_end.entity.enums.NotificationType;
import com.example.back_end.entity.enums.RoleName;
import com.example.back_end.entity.enums.TeacherApplicationStatus;
import com.example.back_end.exception.BusinessException;
import com.example.back_end.exception.ResourceNotFoundException;
import com.example.back_end.repository.TeacherApplicationRepository;
import com.example.back_end.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/** Applicant-facing submit/track flow. Admin review (list/approve/reject) lives in service.admin.AdminTeacherApplicationService. */
@Service
@RequiredArgsConstructor
@Transactional
public class TeacherApplicationService {

    private final TeacherApplicationRepository teacherApplicationRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final S3Service s3Service;

    public TeacherApplicationResponse submit(String email, CreateTeacherApplicationRequest request) {
        User user = userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        boolean isAdmin = user.getRoles().stream()
                .anyMatch(role -> role.getRoleName() == RoleName.ROLE_ADMIN);
        if (isAdmin) {
            throw new BusinessException("Quản trị viên không thể đăng ký làm giảng viên.");
        }

        boolean alreadyTeacher = user.getRoles().stream()
                .anyMatch(role -> role.getRoleName() == RoleName.ROLE_TEACHER);
        if (alreadyTeacher) {
            throw new BusinessException("Bạn đã là giảng viên.");
        }

        teacherApplicationRepository.findFirstByUser_IdAndStatus(user.getId(), TeacherApplicationStatus.PENDING)
                .ifPresent(existing -> {
                    throw new BusinessException("Bạn đã có đơn đang chờ duyệt.");
                });

        TeacherApplication application = new TeacherApplication();
        application.setUser(user);
        application.setSpecialization(request.specialization());
        application.setExperience(request.experience());
        application.setCvKey(request.cvKey());
        application.setStatus(TeacherApplicationStatus.PENDING);
        application.setCreatedAt(Instant.now());
        teacherApplicationRepository.save(application);

        List<User> admins = userRepository.findAllAdmins();
        notificationService.createForAll(
                admins,
                NotificationType.TEACHER_APPLICATION_SUBMITTED,
                "New instructor application",
                (user.getFullName() != null ? user.getFullName() : user.getEmail()) + " submitted an application to become an instructor.",
                "/learnova/admin/teacher-applications",
                Map.of("applicationId", application.getId(), "userId", user.getId())
        );

        return toResponse(application);
    }

    @Transactional(readOnly = true)
    public List<TeacherApplicationResponse> getMyApplications(String email) {
        User user = userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return teacherApplicationRepository.findAllByUser_IdOrderByCreatedAtDesc(user.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CvUrlResponse getMyCvUrl(Long id, String email) {
        TeacherApplication application = teacherApplicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found id=" + id));

        if (!application.getUser().getEmail().equalsIgnoreCase(email)) {
            throw new BusinessException("Bạn không có quyền xem CV của đơn này.");
        }

        return new CvUrlResponse(s3Service.generateCloudFrontSignedUrl(application.getCvKey()));
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
