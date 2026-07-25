package com.example.back_end.service;

import com.example.back_end.dto.response.TeacherCoursesResponse;
import com.example.back_end.dto.response.TeacherDashboardResponse;
import com.example.back_end.entity.Enrollment;
import com.example.back_end.entity.User;
import com.example.back_end.entity.enums.CourseStatus;
import com.example.back_end.exception.ResourceNotFoundException;
import com.example.back_end.repository.EnrollmentRepository;
import com.example.back_end.repository.LessonQARepository;
import com.example.back_end.repository.OrderRepository;
import com.example.back_end.repository.ReviewRepository;
import com.example.back_end.repository.UserRepository;
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
    private final CourseService courseService;
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
        Double revenueDeltaPercent = percentDelta(prevRevenueTotal, revenueTotal);

        long enrollmentsBeforeWindow = enrollmentRepository.countEnrollmentsByInstructorIdBefore(instructorId, windowStart);
        List<EnrollmentRepository.DailyCountProjection> currentWindowDailyCounts =
                enrollmentRepository.findDailyNewStudentsByInstructor(instructorId, windowStart);
        List<TeacherDashboardResponse.GrowthPoint> studentGrowth = buildCumulativeGrowth(
                currentWindowDailyCounts, enrollmentsBeforeWindow);

        long enrollmentsInCurrentWindow = currentWindowDailyCounts.stream()
                .mapToLong(EnrollmentRepository.DailyCountProjection::getCount)
                .sum();
        long enrollmentsInPrevWindow = enrollmentRepository
                .findDailyNewStudentsByInstructor(instructorId, prevWindowStart)
                .stream()
                .filter(row -> row.getDay().isBefore(LocalDate.now(ZoneOffset.UTC).minusDays(TREND_WINDOW_DAYS)))
                .mapToLong(EnrollmentRepository.DailyCountProjection::getCount)
                .sum();
        Double studentsDeltaPercent = percentDelta(
                BigDecimal.valueOf(enrollmentsInPrevWindow), BigDecimal.valueOf(enrollmentsInCurrentWindow));

        List<TeacherDashboardResponse.RecentEnrollment> recentEnrollments = enrollmentRepository
                .findRecentByInstructorId(instructorId, PageRequest.of(0, RECENT_ENROLLMENTS_LIMIT))
                .stream()
                .map(this::toRecentEnrollment)
                .toList();

        List<TeacherCoursesResponse> myCourses = courseService.getMyCourses(email);

        Map<Long, BigDecimal> revenueByCourse = orderRepository.findRevenueByCourseForInstructor(instructorId)
                .stream()
                .collect(java.util.stream.Collectors.toMap(
                        OrderRepository.CourseRevenueProjection::getCourseId,
                        OrderRepository.CourseRevenueProjection::getAmount));

        Map<Long, Double> progressByCourse = enrollmentRepository.findAvgProgressByCourseForInstructor(instructorId)
                .stream()
                .collect(java.util.stream.Collectors.toMap(
                        EnrollmentRepository.CourseProgressProjection::getCourseId,
                        EnrollmentRepository.CourseProgressProjection::getAvgProgress));

        List<TeacherDashboardResponse.TopCourseRow> topCourses = myCourses.stream()
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

        TeacherDashboardResponse.AttentionSummary attention = buildAttentionSummary(
                myCourses, instructorId, reviewWindowStart);

        TeacherDashboardResponse.CourseStatusCounts courseStatusCounts = buildCourseStatusCounts(myCourses);

        return new TeacherDashboardResponse(
                totalStudents,
                avgRating,
                ratingCount,
                completionRate,
                revenueTotal,
                revenueDeltaPercent,
                newStudentsThisMonth,
                studentsDeltaPercent,
                revenueByDay,
                studentGrowth,
                recentEnrollments,
                topCourses,
                attention,
                courseStatusCounts
        );
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

    private Double percentDelta(BigDecimal previous, BigDecimal current) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }
        return current.subtract(previous)
                .divide(previous, 4, java.math.RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue();
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
