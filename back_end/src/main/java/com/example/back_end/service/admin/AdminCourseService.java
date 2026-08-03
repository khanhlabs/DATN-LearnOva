package com.example.back_end.service.admin;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;

import com.example.back_end.dto.response.admin.AdminCourseDetailResponse;
import com.example.back_end.dto.response.admin.AdminCourseResponse;
import com.example.back_end.entity.enums.CourseStatus;
import com.example.back_end.entity.enums.NotificationType;
import com.example.back_end.exception.BusinessException;
import com.example.back_end.exception.ResourceNotFoundException;
import com.example.back_end.repository.admin.AdminCourseRepository;
import com.example.back_end.service.CourseIndexService;
import com.example.back_end.service.EmailService;
import com.example.back_end.service.NotificationService;
import com.example.back_end.service.S3Service;

import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

@Service
@Transactional
public class AdminCourseService {

    private static final Logger log = LoggerFactory.getLogger(AdminCourseService.class);

    private final AdminCourseRepository courseRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final S3Service s3Service;
    private final CourseIndexService courseIndexService;

    public AdminCourseService(
            AdminCourseRepository courseRepository,
            NotificationService notificationService,
            EmailService emailService,
            S3Service s3Service,
            CourseIndexService courseIndexService
    ) {
        this.courseRepository = courseRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
        this.s3Service = s3Service;
        this.courseIndexService = courseIndexService;
    }

    public List<AdminCourseResponse> getAllCourses() {
        return courseRepository.findAllWithInstructor().stream()
                .map(this::toResponse)
                .toList();
    }

    public String getThumbnailUrl(String thumbnailKey) {
        if (thumbnailKey == null || thumbnailKey.trim().isEmpty()) {
            throw new BusinessException("Thumbnail key is required.");
        }

        return s3Service.generateCloudFrontSignedUrl(thumbnailKey.trim());
    }

    public AdminCourseDetailResponse getCourseDetail(Long id) {
        Course course = courseRepository.findByIdWithDetail(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found id=" + id));
        return toDetailResponse(course);
    }

    public AdminCourseDetailResponse approveCourse(Long id) {
        Course course = courseRepository.findByIdWithDetail(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found id=" + id));

        if (course.getStatus() != CourseStatus.PENDING_REVIEW) {
            throw new BusinessException("Only courses pending review can be approved.");
        }

        course.setStatus(CourseStatus.PUBLISHED);
        course.setIsDeleted(false);
        course.setRejectionReason(null);
        course.setPublishedAt(OffsetDateTime.now());
        course.setUpdatedAt(Instant.now());
        courseRepository.save(course);
        courseIndexService.sync(course);

        notifyInstructor(
                course,
                NotificationType.COURSE_APPROVED,
                "Course approved",
                "Your course \"" + course.getTitle() + "\" has been approved and published.",
                () -> emailService.sendCourseApprovedEmail(
                        course.getInstructor().getEmail(), course.getInstructor().getFullName(), course.getTitle())
        );

        return toDetailResponse(course);
    }

    public AdminCourseDetailResponse rejectCourse(Long id, String reason) {
        Course course = courseRepository.findByIdWithDetail(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found id=" + id));

        if (course.getStatus() != CourseStatus.PENDING_REVIEW) {
            throw new BusinessException("Only courses pending review can be rejected.");
        }

        course.setStatus(CourseStatus.REJECTED);
        course.setRejectionReason(reason);
        course.setUpdatedAt(Instant.now());
        courseRepository.save(course);
        courseIndexService.sync(course);

        notifyInstructor(
                course,
                NotificationType.COURSE_REJECTED,
                "Course rejected",
                "Your course \"" + course.getTitle() + "\" was rejected. Reason: " + reason,
                () -> emailService.sendCourseRejectedEmail(
                        course.getInstructor().getEmail(), course.getInstructor().getFullName(), course.getTitle(), reason)
        );

        return toDetailResponse(course);
    }

    public AdminCourseDetailResponse hideCourse(Long id) {
        Course course = courseRepository.findByIdWithDetail(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found id=" + id));

        if (course.getStatus() != CourseStatus.PENDING_REVIEW) {
            throw new BusinessException("Only courses pending review can be hidden.");
        }

        course.setStatus(CourseStatus.ARCHIVED);
        course.setIsDeleted(false);
        course.setUpdatedAt(Instant.now());
        courseRepository.save(course);
        courseIndexService.sync(course);

        return toDetailResponse(course);
    }

    private void notifyInstructor(Course course, NotificationType type, String title, String content, Runnable sendEmail) {
        notificationService.create(
                course.getInstructor(),
                type,
                title,
                content,
                "/learnova/teacher/courses",
                Map.of("courseId", course.getId(), "courseTitle", course.getTitle())
        );

        try {
            sendEmail.run();
        } catch (Exception e) {
            log.error("Failed to send course status email for course id={}", course.getId(), e);
        }
    }

    private AdminCourseResponse toResponse(Course course) {
        Long instructorId = course.getInstructor() == null ? null : course.getInstructor().getId();
        String instructorName = course.getInstructor() == null ? null
                : (course.getInstructor().getFullName() == null
                        ? course.getInstructor().getEmail()
                        : course.getInstructor().getFullName());
        String level = course.getLevel() == null ? null : course.getLevel().name();
        String status = Boolean.TRUE.equals(course.getIsDeleted()) ? "DELETED"
                : (course.getStatus() == null ? null : course.getStatus().name());

        var primaryCategory = course.getCourseCategories().stream()
                .filter(cc -> Boolean.TRUE.equals(cc.getIsPrimary()))
                .findFirst()
                .orElse(null);
        Long categoryId = primaryCategory == null ? null : primaryCategory.getCategory().getId();
        String categoryName = primaryCategory == null ? null : primaryCategory.getCategory().getName();

        return new AdminCourseResponse(
                course.getId(),
                course.getThumbnailKey(),
                course.getTitle(),
                course.getSlug(),
                course.getBasePrice(),
                level,
                status,
                instructorId,
                instructorName,
                categoryId,
                categoryName,
                course.getPublishedAt()
        );
    }

    private AdminCourseDetailResponse toDetailResponse(Course course) {
        User instructor = course.getInstructor();
        String instructorName = instructor == null ? null
                : (instructor.getFullName() != null ? instructor.getFullName() : instructor.getEmail());
        String instructorAvatar = instructor == null ? null : s3Service.resolveAvatarUrl(instructor.getAvatar());

        String status = Boolean.TRUE.equals(course.getIsDeleted()) ? "DELETED"
                : (course.getStatus() == null ? null : course.getStatus().name());

        var primaryCategory = course.getCourseCategories().stream()
                .filter(cc -> Boolean.TRUE.equals(cc.getIsPrimary()))
                .findFirst()
                .orElse(null);
        String categoryName = primaryCategory != null ? primaryCategory.getCategory().getName() : null;
        Long categoryId = primaryCategory != null ? primaryCategory.getCategory().getId() : null;

        List<AdminCourseDetailResponse.SectionInfo> sections = course.getSections().stream()
                .filter(s -> !Boolean.TRUE.equals(s.getIsDeleted()))
                .sorted(Comparator.comparingDouble(s -> s.getSectionOrder() != null ? s.getSectionOrder() : 0.0))
                .map(s -> {
                    List<AdminCourseDetailResponse.LessonInfo> lessons = s.getLessons().stream()
                            .filter(l -> !Boolean.TRUE.equals(l.getIsDeleted()))
                            .sorted(Comparator.comparingDouble(l -> l.getLessonOrder() != null ? l.getLessonOrder() : 0.0))
                            .map(l -> new AdminCourseDetailResponse.LessonInfo(
                                    l.getId(),
                                    l.getTitle(),
                                    l.getLessonOrder(),
                                    l.getDurationSeconds(),
                                    l.getVideoKey(),
                                    l.getIsPreview()
                            ))
                            .toList();
                    return new AdminCourseDetailResponse.SectionInfo(
                            s.getId(),
                            s.getTitle(),
                            s.getSectionOrder(),
                            lessons
                    );
                })
                .toList();

        long lessonCount = sections.stream().mapToLong(s -> s.lessons().size()).sum();
        long totalDurationSeconds = sections.stream()
                .flatMap(s -> s.lessons().stream())
                .mapToLong(l -> l.durationSeconds() != null ? l.durationSeconds() : 0)
                .sum();

        return new AdminCourseDetailResponse(
                course.getId(),
                course.getTitle(),
                course.getDescription(),
                course.getThumbnailKey(),
                course.getBasePrice(),
                course.getLevel() == null ? null : course.getLevel().name(),
                course.getLanguage(),
                status,
                instructor == null ? null : instructor.getId(),
                instructorName,
                instructorAvatar,
                categoryName,
                categoryId,
                course.getRequirements(),
                course.getWhatYouLearn(),
                course.getPublishedAt(),
                lessonCount,
                totalDurationSeconds,
                sections
        );
    }

}
