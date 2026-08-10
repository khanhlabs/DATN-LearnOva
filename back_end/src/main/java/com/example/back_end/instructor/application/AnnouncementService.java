package com.example.back_end.instructor.application;

import com.example.back_end.auth.infrastructure.EmailService;
import com.example.back_end.notification.application.NotificationService;

import com.example.back_end.instructor.adapter.in.web.dto.CreateAnnouncementRequest;
import com.example.back_end.instructor.adapter.in.web.dto.AnnouncementResponse;
import com.example.back_end.course.domain.Course;
import com.example.back_end.course.domain.CourseAnnouncement;
import com.example.back_end.auth.domain.User;
import com.example.back_end.notification.domain.enums.NotificationType;
import com.example.back_end.shared.exception.BusinessException;
import com.example.back_end.shared.exception.ResourceNotFoundException;
import com.example.back_end.instructor.infrastructure.persistence.CourseAnnouncementRepository;
import com.example.back_end.course.infrastructure.persistence.CourseRepository;
import com.example.back_end.learning.infrastructure.persistence.EnrollmentRepository;
import com.example.back_end.auth.infrastructure.persistence.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class AnnouncementService {

    private final CourseAnnouncementRepository courseAnnouncementRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    @Value("${app.frontend.base-url}")
    private String frontendBaseUrl;

    public AnnouncementResponse createAnnouncement(CreateAnnouncementRequest request, String email) {
        User teacher = findTeacher(email);

        Course course = courseRepository.findById(request.courseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));

        if (!course.getInstructor().getId().equals(teacher.getId())) {
            throw new BusinessException("You don't own this course");
        }

        List<User> students = enrollmentRepository.findDistinctStudentsByCourseId(course.getId());

        CourseAnnouncement announcement = new CourseAnnouncement();
        announcement.setCourse(course);
        announcement.setTeacher(teacher);
        announcement.setTitle(request.title());
        announcement.setContent(request.content());
        announcement.setRecipientCount(students.size());
        announcement.setCreatedAt(Instant.now());
        courseAnnouncementRepository.save(announcement);

        String courseLink = "/learnova/user/CoursesDetail/" + course.getId();

        notificationService.createForAll(
                students,
                NotificationType.COURSE_ANNOUNCEMENT,
                request.title(),
                request.content(),
                courseLink,
                Map.of("courseId", course.getId(), "announcementId", announcement.getId())
        );

        String courseUrl = frontendBaseUrl + courseLink;
        List<EmailService.AnnouncementRecipient> recipients = students.stream()
                .map(student -> new EmailService.AnnouncementRecipient(student.getEmail(), student.getFullName()))
                .toList();

        emailService.sendCourseAnnouncementEmailsAsync(
                recipients,
                course.getTitle(),
                request.title(),
                request.content(),
                courseUrl
        );

        return toResponse(announcement);
    }

    @Transactional(readOnly = true)
    public Page<AnnouncementResponse> getMyAnnouncements(String email, Pageable pageable) {
        User teacher = findTeacher(email);
        return courseAnnouncementRepository.findByTeacher_IdOrderByCreatedAtDesc(teacher.getId(), pageable)
                .map(this::toResponse);
    }

    private User findTeacher(String email) {
        return userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private AnnouncementResponse toResponse(CourseAnnouncement announcement) {
        return new AnnouncementResponse(
                announcement.getId(),
                announcement.getCourse().getId(),
                announcement.getCourse().getTitle(),
                announcement.getTitle(),
                announcement.getContent(),
                announcement.getRecipientCount(),
                announcement.getCreatedAt()
        );
    }
}
