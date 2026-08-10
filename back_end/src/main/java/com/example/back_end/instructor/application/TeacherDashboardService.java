package com.example.back_end.instructor.application;

import com.example.back_end.instructor.adapter.in.web.dto.TeacherCoursesResponse;
import com.example.back_end.instructor.adapter.in.web.dto.TeacherDashboardResponse;
import com.example.back_end.learning.domain.Enrollment;
import com.example.back_end.auth.domain.User;
import com.example.back_end.course.domain.enums.CourseStatus;
import com.example.back_end.shared.exception.ResourceNotFoundException;
import com.example.back_end.learning.infrastructure.persistence.EnrollmentRepository;
import com.example.back_end.assessment.infrastructure.persistence.LessonQARepository;
import com.example.back_end.commerce.infrastructure.persistence.OrderRepository;
import com.example.back_end.assessment.infrastructure.persistence.ReviewRepository;
import com.example.back_end.auth.infrastructure.persistence.UserRepository;
import com.example.back_end.media.infrastructure.storage.S3Service;
import com.example.back_end.shared.util.PercentDeltaCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeacherDashboardService {

    private static final int RECENT_ENROLLMENTS_LIMIT = 5;
    private static final int TOP_COURSES_LIMIT = 5;
    private static final int TREND_WINDOW_DAYS = 30;
    private static final int RECENT_REVIEW_WINDOW_DAYS = 7;

    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final LessonQARepository lessonQARepository;
    private final TeacherCourseService teacherCourseService;
    private final S3Service s3Service;

    @Transactional(readOnly = true)
    public TeacherDashboardResponse getDashboard(String email) {
        User instructor = userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Long instructorId = instructor.getId();

        Instant monthStart = LocalDate.now(ZoneOffset.UTC)
                .withDayOfMonth(1)
                .atStartOfDay(ZoneOffset.UTC)
                .toInstant();
        Instant windowStart = Instant.now().minus(TREND_WINDOW_DAYS, ChronoUnit.DAYS);
        Instant prevWindowStart = Instant.now().minus((long) TREND_WINDOW_DAYS * 2, ChronoUnit.DAYS);
        Instant reviewWindowStart = Instant.now().minus(RECENT_REVIEW_WINDOW_DAYS, ChronoUnit.DAYS);

        long totalStudents = enrollmentRepository.countDistinctStudentsByInstructorId(instructorId);
        double avgRating = reviewRepository.getAverageRatingByInstructorId(instructorId);
        long ratingCount = reviewRepository.countByCourseInstructorId(instructorId);
        double completionRate = enrollmentRepository.findAvgProgressByInstructorId(instructorId);
        long newStudentsThisMonth = enrollmentRepository.countNewEnrollmentsSince(instructorId, monthStart);

        RevenueTrend revenueTrend = buildRevenueTrend(instructorId, windowStart, prevWindowStart);
        StudentGrowth studentGrowth = buildStudentGrowth(instructorId, windowStart, prevWindowStart);

        List<TeacherDashboardResponse.RecentEnrollment> recentEnrollments = enrollmentRepository
                .findRecentByInstructorId(instructorId, PageRequest.of(0, RECENT_ENROLLMENTS_LIMIT))
                .stream()
                .map(this::toRecentEnrollment)
                .toList();

        List<TeacherCoursesResponse> myCourses = teacherCourseService.getMyCourses(email);
        List<TeacherDashboardResponse.TopCourseRow> topCourses = buildTopCourses(myCourses, instructorId);
        TeacherDashboardResponse.AttentionSummary attention = buildAttentionSummary(myCourses, instructorId, reviewWindowStart);
        TeacherDashboardResponse.CourseStatusCounts courseStatusCounts = buildCourseStatusCounts(myCourses);

        return new TeacherDashboardResponse(
                totalStudents,
                avgRating,
                ratingCount,
                completionRate,
                revenueTrend.total(),
                revenueTrend.deltaPercent(),
                newStudentsThisMonth,
                studentGrowth.deltaPercent(),
                revenueTrend.byDay(),
                studentGrowth.points(),
                recentEnrollments,
                topCourses,
                attention,
                courseStatusCounts
        );
    }

    private record RevenueTrend(List<TeacherDashboardResponse.RevenuePoint> byDay, BigDecimal total, Double deltaPercent) {
    }

    private RevenueTrend buildRevenueTrend(Long instructorId, Instant windowStart, Instant prevWindowStart) {
        List<TeacherDashboardResponse.RevenuePoint> revenueByDay = orderRepository
                .findDailyRevenueByInstructor(instructorId, windowStart)
                .stream()
                .map(row -> new TeacherDashboardResponse.RevenuePoint(row.getDay(), row.getAmount()))
                .toList();

        BigDecimal revenueTotal = revenueByDay.stream()
                .map(TeacherDashboardResponse.RevenuePoint::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal prevRevenueTotal = orderRepository.findDailyRevenueByInstructor(instructorId, prevWindowStart)
                .stream()
                .filter(row -> row.getDay().isBefore(LocalDate.now(ZoneOffset.UTC).minusDays(TREND_WINDOW_DAYS)))
                .map(row -> row.getAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new RevenueTrend(revenueByDay, revenueTotal, PercentDeltaCalculator.percentDelta(prevRevenueTotal, revenueTotal));
    }

    private record StudentGrowth(List<TeacherDashboardResponse.GrowthPoint> points, Double deltaPercent) {
    }

    private StudentGrowth buildStudentGrowth(Long instructorId, Instant windowStart, Instant prevWindowStart) {
        long enrollmentsBeforeWindow = enrollmentRepository.countEnrollmentsByInstructorIdBefore(instructorId, windowStart);
        List<EnrollmentRepository.DailyCountProjection> currentWindowDailyCounts =
                enrollmentRepository.findDailyNewStudentsByInstructor(instructorId, windowStart);
        List<TeacherDashboardResponse.GrowthPoint> points = buildCumulativeGrowth(currentWindowDailyCounts, enrollmentsBeforeWindow);

        long enrollmentsInCurrentWindow = currentWindowDailyCounts.stream()
                .mapToLong(EnrollmentRepository.DailyCountProjection::getCount)
                .sum();
        long enrollmentsInPrevWindow = enrollmentRepository
                .findDailyNewStudentsByInstructor(instructorId, prevWindowStart)
                .stream()
                .filter(row -> row.getDay().isBefore(LocalDate.now(ZoneOffset.UTC).minusDays(TREND_WINDOW_DAYS)))
                .mapToLong(EnrollmentRepository.DailyCountProjection::getCount)
                .sum();

        Double deltaPercent = PercentDeltaCalculator.percentDelta(
                BigDecimal.valueOf(enrollmentsInPrevWindow), BigDecimal.valueOf(enrollmentsInCurrentWindow));

        return new StudentGrowth(points, deltaPercent);
    }

    private List<TeacherDashboardResponse.GrowthPoint> buildCumulativeGrowth(
            List<EnrollmentRepository.DailyCountProjection> dailyCounts, long baseline) {
        long[] running = {baseline};
        return dailyCounts.stream()
                .map(row -> {
                    running[0] += row.getCount();
                    return new TeacherDashboardResponse.GrowthPoint(row.getDay(), running[0]);
                })
                .toList();
    }

    private List<TeacherDashboardResponse.TopCourseRow> buildTopCourses(List<TeacherCoursesResponse> myCourses, Long instructorId) {
        Map<Long, BigDecimal> revenueByCourse = orderRepository.findRevenueByCourseForInstructor(instructorId)
                .stream()
                .collect(Collectors.toMap(
                        OrderRepository.CourseRevenueProjection::getCourseId,
                        OrderRepository.CourseRevenueProjection::getAmount));

        Map<Long, Double> progressByCourse = enrollmentRepository.findAvgProgressByCourseForInstructor(instructorId)
                .stream()
                .collect(Collectors.toMap(
                        EnrollmentRepository.CourseProgressProjection::getCourseId,
                        EnrollmentRepository.CourseProgressProjection::getAvgProgress));

        return myCourses.stream()
                .filter(c -> !Boolean.TRUE.equals(c.isDeleted()))
                .sorted(Comparator.comparingLong(TeacherCoursesResponse::studentCount).reversed())
                .limit(TOP_COURSES_LIMIT)
                .map(course -> new TeacherDashboardResponse.TopCourseRow(
                        course.courseId(),
                        course.title(),
                        course.thumbnailKey(),
                        course.categoryName(),
                        course.avgRating(),
                        course.ratingCount(),
                        course.studentCount(),
                        revenueByCourse.getOrDefault(course.courseId(), BigDecimal.ZERO),
                        progressByCourse.getOrDefault(course.courseId(), 0.0)
                ))
                .toList();
    }

    private TeacherDashboardResponse.AttentionSummary buildAttentionSummary(
            List<TeacherCoursesResponse> myCourses, Long instructorId, Instant reviewWindowStart) {
        TeacherDashboardResponse.RejectedCourseInfo rejectedCourse = myCourses.stream()
                .filter(c -> c.status() == CourseStatus.REJECTED && !Boolean.TRUE.equals(c.isDeleted()))
                .max(Comparator.comparing(TeacherCoursesResponse::createdAt))
                .map(c -> new TeacherDashboardResponse.RejectedCourseInfo(c.courseId(), c.title(), c.rejectionReason()))
                .orElse(null);

        TeacherDashboardResponse.PendingReviewCourseInfo pendingReviewCourse = myCourses.stream()
                .filter(c -> c.status() == CourseStatus.PENDING_REVIEW && !Boolean.TRUE.equals(c.isDeleted()))
                .max(Comparator.comparing(TeacherCoursesResponse::createdAt))
                .map(c -> new TeacherDashboardResponse.PendingReviewCourseInfo(c.courseId(), c.title()))
                .orElse(null);

        long newReviewCount = reviewRepository.countByCourseInstructorIdAndCreatedAtGreaterThanEqual(instructorId, reviewWindowStart);
        long pendingQaCount = lessonQARepository.countUnsolvedQuestionsByInstructor(instructorId);

        return new TeacherDashboardResponse.AttentionSummary(rejectedCourse, pendingReviewCourse, newReviewCount, pendingQaCount);
    }

    private TeacherDashboardResponse.CourseStatusCounts buildCourseStatusCounts(List<TeacherCoursesResponse> myCourses) {
        long deleted = myCourses.stream().filter(c -> Boolean.TRUE.equals(c.isDeleted())).count();
        long published = myCourses.stream().filter(c -> !Boolean.TRUE.equals(c.isDeleted()) && c.status() == CourseStatus.PUBLISHED).count();
        long draft = myCourses.stream().filter(c -> !Boolean.TRUE.equals(c.isDeleted()) && c.status() == CourseStatus.DRAFT).count();
        long pendingReview = myCourses.stream().filter(c -> !Boolean.TRUE.equals(c.isDeleted()) && c.status() == CourseStatus.PENDING_REVIEW).count();
        long rejected = myCourses.stream().filter(c -> !Boolean.TRUE.equals(c.isDeleted()) && c.status() == CourseStatus.REJECTED).count();

        return new TeacherDashboardResponse.CourseStatusCounts(published, draft, pendingReview, rejected, deleted);
    }

    private TeacherDashboardResponse.RecentEnrollment toRecentEnrollment(Enrollment enrollment) {
        return new TeacherDashboardResponse.RecentEnrollment(
                enrollment.getUser().getId(),
                enrollment.getUser().getFullName(),
                s3Service.resolveAvatarUrl(enrollment.getUser().getAvatar()),
                enrollment.getCourse().getId(),
                enrollment.getCourse().getTitle(),
                enrollment.getEnrolledAt()
        );
    }
}
