package com.example.back_end.service;

import com.example.back_end.dto.request.CreateCourseReportRequest;
import com.example.back_end.dto.response.CourseReportResponse;
import com.example.back_end.dto.response.CourseReportStatsResponse;
import com.example.back_end.entity.enums.NotificationType;
import com.example.back_end.exception.BusinessException;
import com.example.back_end.exception.ResourceNotFoundException;
import com.example.back_end.repository.CourseRepository;
import com.example.back_end.repository.LessonRepository;
import com.example.back_end.repository.ReportCategoryRepository;
import com.example.back_end.repository.ReportRepository;
import com.example.back_end.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * Source of truth: {@code reports} / {@code report_categories} (Flyway V3).
 * Notifications are only for admin/teacher bells.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class CourseReportService {

    public static final String CAT_COURSE_ISSUE = "COURSE_ISSUE";
    public static final String CAT_POLICY_VIOLATION = "POLICY_VIOLATION";

    private static final Set<String> COURSE_ISSUE_REASONS = Set.of(
            "VIDEO_ERROR",
            "AUDIO_ERROR",
            "BROKEN_DOCUMENT",
            "OUTDATED_CONTENT",
            "INCORRECT_CONTENT",
            "OTHER_COURSE_ISSUE",
            "MISLEADING_CONTENT",
            "OTHER"
    );
    private static final Set<String> POLICY_VIOLATION_REASONS = Set.of(
            "SPAM",
            "FRAUD",
            "COPYRIGHT",
            "SENSITIVE_CONTENT",
            "HARASSMENT",
            "PROHIBITED_CONTENT",
            "INSTRUCTOR_BEHAVIOR",
            "OTHER_VIOLATION"
    );
    private static final Set<String> ALLOWED_REASONS;
    static {
        ALLOWED_REASONS = new HashSet<>();
        ALLOWED_REASONS.addAll(COURSE_ISSUE_REASONS);
        ALLOWED_REASONS.addAll(POLICY_VIOLATION_REASONS);
    }
    private static final Set<String> HIGH_SEVERITY_REASONS = Set.of(
            "SENSITIVE_CONTENT",
            "COPYRIGHT",
            "FRAUD",
            "HARASSMENT",
            "PROHIBITED_CONTENT"
    );
    private static final Set<String> OPEN_STATUSES = Set.of("PENDING", "REVIEWING");
    private static final Set<String> CLOSED_STATUSES = Set.of("RESOLVED", "DISMISSED");
    private static final long REPEAT_THRESHOLD_FOR_DELETE = 2L;

    private final ReportRepository reportRepository;
    private final ReportCategoryRepository reportCategoryRepository;
    private final CourseRepository courseRepository;
    private final LessonRepository lessonRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public CourseReportResponse create(Long reporterId, CreateCourseReportRequest request) {
        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Course course = courseRepository.findById(request.courseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course not found id=" + request.courseId()));

        if (course.getInstructor() != null
                && Objects.equals(course.getInstructor().getId(), reporterId)) {
            throw new BusinessException("You cannot report your own course.");
        }

        String reason = request.reason() == null ? "" : request.reason().trim().toUpperCase();
        if (!ALLOWED_REASONS.contains(reason)) {
            throw new BusinessException("Invalid report reason.");
        }
        if (requiresDescription(reason)
                && (request.description() == null || request.description().isBlank())) {
            throw new BusinessException("Description is required for this report reason.");
        }

        if (reportRepository.existsByReporter_IdAndCourse_IdAndStatus(
                reporterId, course.getId(), "PENDING")) {
            throw new BusinessException("You already have a pending report for this course.");
        }

        Lesson lesson = null;
        if (request.lessonId() != null) {
            lesson = lessonRepository.findById(request.lessonId())
                    .orElseThrow(() -> new ResourceNotFoundException("Lesson not found id=" + request.lessonId()));
        }

        String categoryName = categoryOf(reason);
        ReportCategory category = ensureCategory(categoryName);
        boolean teacherVisible = CAT_COURSE_ISSUE.equals(categoryName);
        String description = request.description() == null || request.description().isBlank()
                ? ""
                : request.description().trim();
        String reasonLabel = reasonLabelOf(reason);
        Instant now = Instant.now();

        Report report = new Report();
        report.setReporter(reporter);
        report.setCourse(course);
        report.setLesson(lesson);
        report.setReportedInstructor(course.getInstructor());
        report.setCategory(category);
        report.setReason(reason);
        report.setDescription(description);
        report.setStatus("PENDING");
        report.setTeacherVisible(teacherVisible);
        report.setCreatedAt(now);
        report.setUpdatedAt(now);
        report = reportRepository.save(report);

        List<User> admins = userRepository.findAllAdmins();
        if (admins.isEmpty()) {
            throw new BusinessException("No admin available to receive the report.");
        }

        Map<String, Object> adminMeta = baseNotifyMeta(report, categoryName);
        adminMeta.put("reporterId", reporter.getId());
        adminMeta.put("reporterName",
                reporter.getFullName() != null ? reporter.getFullName() : reporter.getEmail());

        String adminTitle = CAT_POLICY_VIOLATION.equals(categoryName)
                ? "Báo cáo vi phạm chính sách"
                : "Báo cáo sự cố khóa học";
        notificationService.createForAll(
                admins,
                NotificationType.COURSE_REPORTED,
                adminTitle,
                "Khóa \"" + course.getTitle() + "\" bị báo cáo vì: " + reasonLabel,
                "/learnova/admin/violation-reports?id=" + report.getId(),
                adminMeta
        );

        if (teacherVisible && course.getInstructor() != null) {
            Map<String, Object> teacherMeta = baseNotifyMeta(report, categoryName);
            teacherMeta.put("action", "COURSE_ISSUE_REPORTED");
            String lessonHint = lesson != null
                    ? " (bài học \"" + lesson.getTitle() + "\")"
                    : "";
            notificationService.create(
                    course.getInstructor(),
                    NotificationType.GENERIC,
                    "Học viên báo cáo sự cố khóa học",
                    "Khóa \"" + course.getTitle() + "\"" + lessonHint
                            + " có báo cáo: " + reasonLabel
                            + ". Vui lòng kiểm tra và sửa nội dung nếu cần.",
                    "/learnova/teacher/courses",
                    teacherMeta
            );
        }

        return toResponse(report);
    }

    @Transactional(readOnly = true)
    public List<CourseReportResponse> listAll() {
        return reportRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CourseReportResponse getById(Long id) {
        return toResponse(findReport(id));
    }

    @Transactional(readOnly = true)
    public CourseReportStatsResponse getStats() {
        List<CourseReportResponse> reports = listAll();
        long open = reports.stream().filter(r -> OPEN_STATUSES.contains(r.status())).count();
        long reportedCourses = reports.stream()
                .filter(r -> OPEN_STATUSES.contains(r.status()))
                .map(CourseReportResponse::courseId)
                .filter(Objects::nonNull)
                .distinct()
                .count();
        long hidden = reports.stream()
                .filter(r -> Boolean.TRUE.equals(r.courseHidden()))
                .map(CourseReportResponse::courseId)
                .filter(Objects::nonNull)
                .distinct()
                .count();
        long resolved = reports.stream().filter(r -> CLOSED_STATUSES.contains(r.status())).count();
        return new CourseReportStatsResponse(open, reportedCourses, hidden, resolved);
    }

    public CourseReportResponse dismiss(Long id, Long adminId) {
        return updateStatus(id, "DISMISSED");
    }

    public CourseReportResponse resolve(Long id, Long adminId) {
        return updateStatus(id, "RESOLVED");
    }

    public CourseReportResponse hideCourse(Long id, Long adminId) {
        Report report = findReport(id);
        Course course = report.getCourse();
        course.setIsHidden(true);
        course.setUpdatedAt(Instant.now());
        courseRepository.save(course);

        Instant now = Instant.now();
        for (Report r : reportRepository.findAllByOrderByCreatedAtDesc()) {
            if (!Objects.equals(r.getCourse().getId(), course.getId())) {
                continue;
            }
            if (OPEN_STATUSES.contains(r.getStatus())) {
                r.setStatus("RESOLVED");
            }
            r.setUpdatedAt(now);
        }

        notifyInstructor(
                course,
                "Khóa học của bạn đã bị ẩn",
                "Khóa học \"" + course.getTitle()
                        + "\" đã bị ẩn sau khi có báo cáo từ học viên. Vui lòng rà soát nội dung và liên hệ hỗ trợ nếu cần mở lại.",
                Map.of("courseId", course.getId(), "action", "HIDE_COURSE", "reportId", id)
        );

        return toResponse(findReport(id));
    }

    public CourseReportResponse warnInstructor(Long id, Long adminId, String message) {
        Report report = findReport(id);
        Course course = report.getCourse();
        String reason = report.getReason();
        String lessonTitle = report.getLesson() != null ? report.getLesson().getTitle() : null;
        String note = (message == null || message.isBlank())
                ? "Vui lòng kiểm tra và cập nhật lại nội dung video bị báo cáo trong thời gian sớm nhất."
                : message.trim();

        String reasonLabel = reasonLabelOf(reason);
        String target = lessonTitle != null
                ? "bài học \"" + lessonTitle + "\" trong khóa \"" + course.getTitle() + "\""
                : "khóa học \"" + course.getTitle() + "\"";

        Map<String, Object> warnMeta = new HashMap<>();
        warnMeta.put("courseId", course.getId());
        warnMeta.put("lessonId", report.getLesson() != null ? report.getLesson().getId() : null);
        warnMeta.put("reason", reason != null ? reason : "");
        warnMeta.put("action", "WARN_INSTRUCTOR");
        warnMeta.put("reportId", id);
        warnMeta.put("adminId", adminId);

        notifyInstructor(
                course,
                "Yêu cầu cập nhật nội dung khóa học",
                "Admin yêu cầu bạn kiểm tra và sửa " + target
                        + " (lý do báo cáo: " + reasonLabel + "). " + note,
                warnMeta
        );

        Instant now = Instant.now();
        Long lessonId = report.getLesson() != null ? report.getLesson().getId() : null;
        for (Report r : reportRepository.findAllByOrderByCreatedAtDesc()) {
            if (!Objects.equals(r.getCourse().getId(), course.getId())) continue;
            if (reason != null && !reason.equals(r.getReason())) continue;
            if (lessonId != null && r.getLesson() != null
                    && !Objects.equals(r.getLesson().getId(), lessonId)) {
                continue;
            }
            r.setTeacherVisible(true);
            if (OPEN_STATUSES.contains(r.getStatus())) {
                r.setStatus("REVIEWING");
            }
            r.setUpdatedAt(now);
        }

        return toResponse(findReport(id));
    }

    public CourseReportResponse deleteReportedLesson(Long id, Long adminId) {
        Report report = findReport(id);
        Course course = report.getCourse();
        Lesson lesson = report.getLesson();
        String reason = report.getReason();

        if (lesson == null) {
            throw new BusinessException("This report has no lesson target to delete.");
        }
        if (!HIGH_SEVERITY_REASONS.contains(reason)) {
            throw new BusinessException(
                    "Lesson delete is only allowed for high-severity reasons."
            );
        }
        if (!"REVIEWING".equals(report.getStatus()) && !Boolean.TRUE.equals(report.getTeacherVisible())) {
            throw new BusinessException(
                    "Warn the instructor first, then delete only after the same high-severity reason is reported again."
            );
        }

        long sameReason = reportRepository.countSameReason(
                course.getId(), reason, lesson.getId());
        if (sameReason < REPEAT_THRESHOLD_FOR_DELETE) {
            throw new BusinessException(
                    "Delete is only allowed after the same high-severity reason is reported again "
                            + "(need at least " + REPEAT_THRESHOLD_FOR_DELETE + " reports)."
            );
        }

        if (lesson.getSection() == null
                || lesson.getSection().getCourse() == null
                || !Objects.equals(lesson.getSection().getCourse().getId(), course.getId())) {
            throw new BusinessException("Lesson does not belong to the reported course.");
        }
        if (Boolean.TRUE.equals(lesson.getIsDeleted())) {
            throw new BusinessException("This lesson was already deleted.");
        }

        lesson.setIsDeleted(true);
        lesson.setUpdatedAt(Instant.now());
        lessonRepository.save(lesson);

        Instant now = Instant.now();
        for (Report r : reportRepository.findAllByOrderByCreatedAtDesc()) {
            if (!Objects.equals(r.getCourse().getId(), course.getId())) continue;
            if (reason != null && !reason.equals(r.getReason())) continue;
            if (r.getLesson() != null && !Objects.equals(r.getLesson().getId(), lesson.getId())) continue;
            if (OPEN_STATUSES.contains(r.getStatus())) {
                r.setStatus("RESOLVED");
            }
            r.setUpdatedAt(now);
        }

        notifyInstructor(
                course,
                "Bài học đã bị gỡ khỏi khóa học",
                "Bài học \"" + lesson.getTitle() + "\" trong khóa \"" + course.getTitle()
                        + "\" đã bị gỡ sau báo cáo vi phạm.",
                Map.of(
                        "courseId", course.getId(),
                        "lessonId", lesson.getId(),
                        "action", "DELETE_LESSON",
                        "reportId", id
                )
        );

        return toResponse(findReport(id));
    }

    private CourseReportResponse updateStatus(Long id, String status) {
        Report report = findReport(id);
        report.setStatus(status);
        report.setUpdatedAt(Instant.now());
        return toResponse(reportRepository.save(report));
    }

    private Report findReport(Long id) {
        return reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found id=" + id));
    }

    private ReportCategory ensureCategory(String code) {
        return reportCategoryRepository.findByCode(code).orElseGet(() -> {
            ReportCategory created = new ReportCategory();
            created.setCode(code);
            created.setName(CAT_COURSE_ISSUE.equals(code)
                    ? "Vấn đề khóa học"
                    : "Vi phạm chính sách");
            return reportCategoryRepository.save(created);
        });
    }

    private CourseReportResponse toResponse(Report report) {
        Course course = report.getCourse();
        User reporter = report.getReporter();
        Lesson lesson = report.getLesson();
        Long courseId = course != null ? course.getId() : null;
        Long lessonId = lesson != null ? lesson.getId() : null;
        String reason = report.getReason();

        boolean courseHidden = course != null && Boolean.TRUE.equals(course.getIsHidden());
        long reportCount = courseId == null ? 0L : reportRepository.countByCourse_Id(courseId);
        long sameReasonCount = courseId == null
                ? 0L
                : reportRepository.countSameReason(courseId, reason, lessonId);

        boolean instructorWarned = "REVIEWING".equals(report.getStatus());
        boolean lessonDeleted = lesson != null && Boolean.TRUE.equals(lesson.getIsDeleted());
        String severity = severityOf(reason);
        boolean canDeleteLesson = "HIGH".equals(severity)
                && lessonId != null
                && !lessonDeleted
                && sameReasonCount >= REPEAT_THRESHOLD_FOR_DELETE
                && instructorWarned;

        Instant resolvedAt = CLOSED_STATUSES.contains(report.getStatus())
                ? report.getUpdatedAt()
                : null;

        String reportKey = String.valueOf(report.getId());
        String reportCode = "RPT-" + report.getId();

        return new CourseReportResponse(
                report.getId(),
                reportCode,
                reportKey,
                courseId,
                course != null ? course.getTitle() : null,
                courseHidden,
                lessonId,
                lesson != null ? lesson.getTitle() : null,
                reporter != null ? reporter.getId() : null,
                reporter != null
                        ? (reporter.getFullName() != null ? reporter.getFullName() : reporter.getEmail())
                        : null,
                reason,
                report.getDescription(),
                report.getStatus(),
                reportCount,
                null,
                report.getCreatedAt(),
                resolvedAt,
                severity,
                sameReasonCount,
                instructorWarned,
                lessonDeleted,
                canDeleteLesson
        );
    }

    private Map<String, Object> baseNotifyMeta(Report report, String categoryName) {
        Map<String, Object> meta = new HashMap<>();
        meta.put("reportId", report.getId());
        meta.put("reportKey", String.valueOf(report.getId()));
        meta.put("courseId", report.getCourse().getId());
        meta.put("courseTitle", report.getCourse().getTitle());
        meta.put("lessonId", report.getLesson() != null ? report.getLesson().getId() : null);
        meta.put("lessonTitle", report.getLesson() != null ? report.getLesson().getTitle() : null);
        meta.put("category", categoryName);
        meta.put("reason", report.getReason());
        meta.put("status", report.getStatus());
        return meta;
    }

    private void notifyInstructor(Course course, String title, String content, Map<String, Object> metadata) {
        User instructor = course.getInstructor();
        if (instructor == null) {
            return;
        }
        try {
            notificationService.create(
                    instructor,
                    NotificationType.GENERIC,
                    title,
                    content,
                    "/learnova/teacher/courses",
                    metadata
            );
        } catch (RuntimeException ex) {
            // Moderation action already applied — do not fail the admin request if notify fails.
        }
    }

    private String categoryOf(String reason) {
        if (reason != null && POLICY_VIOLATION_REASONS.contains(reason)) {
            return CAT_POLICY_VIOLATION;
        }
        return CAT_COURSE_ISSUE;
    }

    private boolean requiresDescription(String reason) {
        return "OTHER".equals(reason)
                || "OTHER_COURSE_ISSUE".equals(reason)
                || "OTHER_VIOLATION".equals(reason);
    }

    private String reasonLabelOf(String reason) {
        if (reason == null || reason.isBlank()) {
            return "chưa rõ";
        }
        return switch (reason) {
            case "VIDEO_ERROR" -> "lỗi video / không phát được";
            case "AUDIO_ERROR" -> "lỗi âm thanh";
            case "BROKEN_DOCUMENT" -> "tài liệu / tài nguyên bị lỗi";
            case "OUTDATED_CONTENT" -> "nội dung lỗi thời";
            case "INCORRECT_CONTENT" -> "nội dung sai / không chính xác";
            case "OTHER_COURSE_ISSUE" -> "sự cố khóa học khác";
            case "MISLEADING_CONTENT" -> "nội dung sai / gây hiểu nhầm";
            case "OTHER" -> "lý do khác";
            case "SPAM" -> "spam / quảng cáo";
            case "FRAUD" -> "lừa đảo / gian lận";
            case "COPYRIGHT" -> "vi phạm bản quyền";
            case "SENSITIVE_CONTENT" -> "nội dung nhạy cảm / không phù hợp";
            case "HARASSMENT" -> "quấy rối / xúc phạm";
            case "PROHIBITED_CONTENT" -> "nội dung bị cấm";
            case "INSTRUCTOR_BEHAVIOR" -> "hành vi giảng viên";
            case "OTHER_VIOLATION" -> "vi phạm chính sách khác";
            default -> reason;
        };
    }

    private String severityOf(String reason) {
        return HIGH_SEVERITY_REASONS.contains(reason) ? "HIGH" : "NORMAL";
    }
}
