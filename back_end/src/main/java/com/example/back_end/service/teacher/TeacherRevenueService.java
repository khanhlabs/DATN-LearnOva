package com.example.back_end.service.teacher;

import com.example.back_end.dto.response.teacher.TeacherCoursesResponse;
import com.example.back_end.dto.response.teacher.TeacherRevenueResponse;
import com.example.back_end.entity.User;
import com.example.back_end.exception.ResourceNotFoundException;
import com.example.back_end.repository.EnrollmentRepository;
import com.example.back_end.repository.OrderRepository;
import com.example.back_end.repository.ReviewRepository;
import com.example.back_end.repository.UserRepository;
import com.example.back_end.util.PercentDeltaCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
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
public class TeacherRevenueService {

    private static final int TREND_WINDOW_DAYS = 30;
    private static final int TOP_COURSES_LIMIT = 3;
    private static final int TRANSACTIONS_LIMIT = 20;

    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final TeacherCourseService teacherCourseService;

    @Transactional(readOnly = true)
    public TeacherRevenueResponse getRevenue(String email) {
        User instructor = userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Long instructorId = instructor.getId();

        Instant windowStart = Instant.now().minus(TREND_WINDOW_DAYS, ChronoUnit.DAYS);
        Instant prevWindowStart = Instant.now().minus((long) TREND_WINDOW_DAYS * 2, ChronoUnit.DAYS);

        RevenueTrend trend = buildRevenueTrend(instructorId, windowStart, prevWindowStart);
        BigDecimal lifetimeRevenue = orderRepository.findTotalRevenueByInstructor(instructorId);

        long newStudents = enrollmentRepository.countNewEnrollmentsSince(instructorId, windowStart);
        long prevNewStudents = enrollmentRepository.countNewEnrollmentsSince(instructorId, prevWindowStart) - newStudents;
        Double studentsDeltaPercent = PercentDeltaCalculator.percentDelta(
                BigDecimal.valueOf(prevNewStudents), BigDecimal.valueOf(newStudents));

        long ordersCount = orderRepository.countOrdersByInstructorSince(instructorId, windowStart);
        long prevOrdersCount = orderRepository.countOrdersByInstructorSince(instructorId, prevWindowStart) - ordersCount;
        Double ordersDeltaPercent = PercentDeltaCalculator.percentDelta(
                BigDecimal.valueOf(prevOrdersCount), BigDecimal.valueOf(ordersCount));

        BigDecimal avgOrderValue = ordersCount > 0
                ? trend.revenueTotal().divide(BigDecimal.valueOf(ordersCount), 0, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        double avgRating = reviewRepository.getAverageRatingByInstructorId(instructorId);

        BigDecimal totalRefunds = orderRepository.findRefundsByInstructorSince(instructorId, windowStart);
        Double refundsPercentOfOrders = trend.revenueTotal().compareTo(BigDecimal.ZERO) > 0
                ? totalRefunds.divide(trend.revenueTotal(), 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
                : null;

        List<TeacherRevenueResponse.TopRevenueCourse> topCourses = buildTopCourses(email, instructorId);
        List<TeacherRevenueResponse.Transaction> transactions = buildTransactions(instructorId);

        return new TeacherRevenueResponse(
                trend.revenueTotal(),
                trend.revenueDeltaPercent(),
                lifetimeRevenue,
                newStudents,
                studentsDeltaPercent,
                ordersCount,
                ordersDeltaPercent,
                avgOrderValue,
                avgRating,
                trend.revenueByDay(),
                trend.previousRevenueByDay(),
                trend.highestRevenueDay(),
                totalRefunds,
                refundsPercentOfOrders,
                topCourses,
                transactions
        );
    }

    private record RevenueTrend(
            List<TeacherRevenueResponse.RevenuePoint> revenueByDay,
            List<TeacherRevenueResponse.RevenuePoint> previousRevenueByDay,
            BigDecimal revenueTotal,
            Double revenueDeltaPercent,
            TeacherRevenueResponse.HighestRevenueDay highestRevenueDay
    ) {
    }

    private RevenueTrend buildRevenueTrend(Long instructorId, Instant windowStart, Instant prevWindowStart) {
        LocalDate windowBoundaryDay = LocalDate.now(ZoneOffset.UTC).minusDays(TREND_WINDOW_DAYS);

        List<TeacherRevenueResponse.RevenuePoint> revenueByDay = orderRepository
                .findDailyRevenueByInstructor(instructorId, windowStart)
                .stream()
                .map(row -> new TeacherRevenueResponse.RevenuePoint(row.getDay(), row.getAmount()))
                .toList();

        BigDecimal revenueTotal = revenueByDay.stream()
                .map(TeacherRevenueResponse.RevenuePoint::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<TeacherRevenueResponse.RevenuePoint> previousRevenueByDay = orderRepository
                .findDailyRevenueByInstructor(instructorId, prevWindowStart)
                .stream()
                .filter(row -> row.getDay().isBefore(windowBoundaryDay))
                .map(row -> new TeacherRevenueResponse.RevenuePoint(row.getDay(), row.getAmount()))
                .toList();

        BigDecimal prevRevenueTotal = previousRevenueByDay.stream()
                .map(TeacherRevenueResponse.RevenuePoint::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Double revenueDeltaPercent = PercentDeltaCalculator.percentDelta(prevRevenueTotal, revenueTotal);

        TeacherRevenueResponse.HighestRevenueDay highestRevenueDay = revenueByDay.stream()
                .max(Comparator.comparing(TeacherRevenueResponse.RevenuePoint::amount))
                .filter(p -> p.amount().compareTo(BigDecimal.ZERO) > 0)
                .map(p -> new TeacherRevenueResponse.HighestRevenueDay(p.day(), p.amount()))
                .orElse(null);

        return new RevenueTrend(revenueByDay, previousRevenueByDay, revenueTotal, revenueDeltaPercent, highestRevenueDay);
    }

    private List<TeacherRevenueResponse.TopRevenueCourse> buildTopCourses(String email, Long instructorId) {
        Map<Long, BigDecimal> revenueByCourse = orderRepository.findRevenueByCourseForInstructor(instructorId)
                .stream()
                .collect(Collectors.toMap(
                        OrderRepository.CourseRevenueProjection::getCourseId,
                        OrderRepository.CourseRevenueProjection::getAmount));

        List<TeacherCoursesResponse> myCourses = teacherCourseService.getMyCourses(email);
        return myCourses.stream()
                .filter(c -> !Boolean.TRUE.equals(c.isDeleted()))
                .map(c -> new TeacherRevenueResponse.TopRevenueCourse(
                        c.courseId(),
                        c.title(),
                        c.thumbnailKey(),
                        revenueByCourse.getOrDefault(c.courseId(), BigDecimal.ZERO),
                        c.studentCount()
                ))
                .sorted(Comparator.comparing(TeacherRevenueResponse.TopRevenueCourse::revenue).reversed())
                .limit(TOP_COURSES_LIMIT)
                .toList();
    }

    private List<TeacherRevenueResponse.Transaction> buildTransactions(Long instructorId) {
        return orderRepository
                .findRecentTransactionsByInstructor(instructorId, TRANSACTIONS_LIMIT)
                .stream()
                .map(row -> new TeacherRevenueResponse.Transaction(
                        row.getOrderId(),
                        row.getStudentName(),
                        row.getStudentAvatar(),
                        row.getCourseTitle(),
                        row.getPrice(),
                        row.getPaymentMethod(),
                        row.getPaidAt()
                ))
                .toList();
    }
}
