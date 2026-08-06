package com.example.back_end.service.admin;

import com.example.back_end.dto.response.admin.AdminRevenueComparisonResponse;
import com.example.back_end.dto.response.admin.AdminRevenueCourseRankingResponse;
import com.example.back_end.dto.response.admin.AdminRevenueInstructorRankingResponse;
import com.example.back_end.dto.response.admin.AdminRevenueOverviewResponse;
import com.example.back_end.dto.response.admin.AdminRevenueTransactionInsightsResponse;
import com.example.back_end.dto.response.admin.AdminRevenueTransactionResponse;
import com.example.back_end.repository.PayoutRequestRepository;
import com.example.back_end.repository.admin.AdminRevenueRepository;
import com.example.back_end.service.ExchangeRateService;
import com.example.back_end.service.RevenueShareCalculator;
import com.example.back_end.util.PercentDeltaCalculator;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminRevenueService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final Set<String> VALID_RANGES = Set.of("day", "week", "month", "year");
    private static final Set<String> VALID_PAYMENT_METHODS = Set.of("MOMO", "VNPAY", "PAYPAL", "PAYOS");
    private static final Set<String> VALID_PAYMENT_STATUSES = Set.of("PENDING", "SUCCESS", "FAILED", "REFUNDED");
    private static final DateTimeFormatter DAY_LABEL = DateTimeFormatter.ofPattern("dd/MM");
    private static final DateTimeFormatter MONTH_LABEL = DateTimeFormatter.ofPattern("MMM yyyy", Locale.ENGLISH);

    private final AdminRevenueRepository adminRevenueRepository;
    private final PayoutRequestRepository payoutRequestRepository;
    private final RevenueShareCalculator revenueShareCalculator;
    private final ExchangeRateService exchangeRateService;

    public Page<AdminRevenueCourseRankingResponse> getTopRevenueCourses(Pageable pageable) {
        BigDecimal usdToVnd = exchangeRateService.getUsdToVnd();
        return adminRevenueRepository.findTopRevenueCourses(pageable)
                .map(row -> new AdminRevenueCourseRankingResponse(
                        row.getCourseId(),
                        row.getTitle(),
                        row.getInstructorId(),
                        row.getInstructor(),
                        row.getCategoryId(),
                        row.getCategory(),
                        row.getStudents(),
                        toUsd(row.getRevenue(), usdToVnd),
                        row.getShare()
                ));
    }

    public Page<AdminRevenueInstructorRankingResponse> getTopEarningInstructors(Pageable pageable) {
        BigDecimal usdToVnd = exchangeRateService.getUsdToVnd();
        return adminRevenueRepository.findTopEarningInstructors(pageable)
                .map(row -> new AdminRevenueInstructorRankingResponse(
                        row.getInstructorId(),
                        row.getInstructor(),
                        row.getTotalCourses(),
                        row.getTotalStudents(),
                        toUsd(row.getRevenue(), usdToVnd),
                        toUsd(row.getAvgPerCourse(), usdToVnd),
                        row.getShare()
                ));
    }

    public AdminRevenueOverviewResponse getOverview() {
        BigDecimal usdToVnd = exchangeRateService.getUsdToVnd();
        Instant now = Instant.now();
        Instant monthStart = YearMonth.now(ZONE).atDay(1).atStartOfDay(ZONE).toInstant();
        Instant prevMonthStart = YearMonth.now(ZONE).minusMonths(1).atDay(1).atStartOfDay(ZONE).toInstant();
        Instant quarterStart = currentQuarterStart().atStartOfDay(ZONE).toInstant();
        Instant prevQuarterStart = currentQuarterStart().minusMonths(3).atStartOfDay(ZONE).toInstant();

        BigDecimal totalRevenue = toUsd(adminRevenueRepository.sumSuccessfulPaymentAmountAllTime(), usdToVnd);
        BigDecimal prevQuarterRevenue = toUsd(adminRevenueRepository.sumSuccessfulPaymentAmountBetween(prevQuarterStart, quarterStart), usdToVnd);
        BigDecimal thisQuarterRevenue = toUsd(adminRevenueRepository.sumSuccessfulPaymentAmountBetween(quarterStart, now), usdToVnd);
        Double totalRevenueDelta = PercentDeltaCalculator.percentDelta(prevQuarterRevenue, thisQuarterRevenue);

        BigDecimal monthlyRevenue = toUsd(adminRevenueRepository.sumSuccessfulPaymentAmountBetween(monthStart, now), usdToVnd);
        BigDecimal prevMonthlyRevenue = toUsd(adminRevenueRepository.sumSuccessfulPaymentAmountBetween(prevMonthStart, monthStart), usdToVnd);
        Double monthlyDelta = PercentDeltaCalculator.percentDelta(prevMonthlyRevenue, monthlyRevenue);

        long totalTransactions = adminRevenueRepository.countSuccessfulPaymentsAllTime();
        long prevQuarterTx = adminRevenueRepository.countSuccessfulPaymentsBetween(prevQuarterStart, quarterStart);
        long thisQuarterTx = adminRevenueRepository.countSuccessfulPaymentsBetween(quarterStart, now);
        Double txDelta = PercentDeltaCalculator.percentDelta(
                BigDecimal.valueOf(prevQuarterTx),
                BigDecimal.valueOf(thisQuarterTx)
        );

        BigDecimal pendingPayoutAmount = toUsd(payoutRequestRepository.sumPendingAmount(), usdToVnd);
        long pendingPayoutCount = payoutRequestRepository.countPending();

        long refundCount = adminRevenueRepository.countRefundedPaymentsAllTime();
        long prevQuarterRefunds = adminRevenueRepository.countRefundedPaymentsBetween(prevQuarterStart, quarterStart);
        long thisQuarterRefunds = adminRevenueRepository.countRefundedPaymentsBetween(quarterStart, now);
        Double refundDelta = PercentDeltaCalculator.percentDelta(
                BigDecimal.valueOf(prevQuarterRefunds),
                BigDecimal.valueOf(thisQuarterRefunds)
        );

        Double growthRate = PercentDeltaCalculator.percentDelta(prevQuarterRevenue, thisQuarterRevenue);

        return new AdminRevenueOverviewResponse(
                new AdminRevenueOverviewResponse.Kpis(
                        totalRevenue,
                        totalRevenueDelta,
                        monthlyRevenue,
                        monthlyDelta,
                        totalTransactions,
                        txDelta,
                        pendingPayoutAmount,
                        pendingPayoutCount,
                        refundCount,
                        refundDelta,
                        growthRate
                ),
                buildCategoryBreakdown(usdToVnd)
        );
    }

    public AdminRevenueComparisonResponse getComparison(String range) {
        BigDecimal usdToVnd = exchangeRateService.getUsdToVnd();
        String normalized = range == null ? "month" : range.trim().toLowerCase(Locale.ROOT);
        if (!VALID_RANGES.contains(normalized)) {
            normalized = "month";
        }

        ChartWindow window = resolveChartWindow(normalized);
        Map<LocalDate, BigDecimal> studentPayments = toPeriodMap(
                adminRevenueRepository.findStudentPaymentsByBucket(window.bucket(), window.from(), window.to())
        );

        List<AdminRevenueComparisonResponse.ComparisonPoint> points = new ArrayList<>();
        for (LocalDate periodStart : window.periods()) {
            BigDecimal studentPaid = toUsd(studentPayments.getOrDefault(periodStart, BigDecimal.ZERO), usdToVnd);
            RevenueShareCalculator.RevenueShare share = revenueShareCalculator.calculate(studentPaid);
            points.add(new AdminRevenueComparisonResponse.ComparisonPoint(
                    formatPeriodLabel(periodStart, normalized),
                    studentPaid,
                    share.instructorAmount(),
                    share.adminAmount()
            ));
        }

        return new AdminRevenueComparisonResponse(normalized, points);
    }

    public Page<AdminRevenueTransactionResponse> getTransactions(
            String search,
            Long categoryId,
            String paymentMethod,
            String status,
            Pageable pageable
    ) {
        String normalizedSearch = blankToNull(search);
        String normalizedMethod = normalizeEnumFilter(paymentMethod, VALID_PAYMENT_METHODS);
        String normalizedStatus = normalizeEnumFilter(status, VALID_PAYMENT_STATUSES);

        BigDecimal usdToVnd = exchangeRateService.getUsdToVnd();
        return adminRevenueRepository.findTransactionLog(
                        normalizedSearch,
                        categoryId,
                        normalizedMethod,
                        normalizedStatus,
                        pageable
                )
                .map(row -> new AdminRevenueTransactionResponse(
                        row.getOrderId(),
                        row.getPaymentId(),
                        row.getOrderItemId(),
                        row.getTransactionId(),
                        row.getStudentName(),
                        row.getCourseName(),
                        row.getCategoryId(),
                        row.getCategoryName(),
                        row.getPaymentMethod(),
                        toUsd(row.getAmount(), usdToVnd),
                        "USD",
                        mapPaymentStatus(row.getStatus()),
                        row.getPaidAt()
                ));
    }

    public AdminRevenueTransactionInsightsResponse getTransactionInsights() {
        BigDecimal usdToVnd = exchangeRateService.getUsdToVnd();
        List<AdminRevenueTransactionInsightsResponse.CategoryMetric> metrics = buildCategoryBreakdown(usdToVnd).stream()
                .map(item -> new AdminRevenueTransactionInsightsResponse.CategoryMetric(
                        item.categoryId(),
                        item.categoryName(),
                        item.amount(),
                        item.sharePercent()
                ))
                .toList();

        AdminRevenueRepository.PeakDayProjection peakDay = adminRevenueRepository.findPeakRevenueDay();
        AdminRevenueRepository.PeakMonthProjection peakMonth = adminRevenueRepository.findPeakRevenueMonth();

        AdminRevenueTransactionInsightsResponse.PeakDayRecord peakDayRecord = null;
        if (peakDay != null && peakDay.getDay() != null) {
            peakDayRecord = new AdminRevenueTransactionInsightsResponse.PeakDayRecord(
                    peakDay.getDay().format(DateTimeFormatter.ofPattern("EEE, dd MMM yyyy", Locale.ENGLISH)),
                    toUsd(peakDay.getAmount(), usdToVnd)
            );
        }

        AdminRevenueTransactionInsightsResponse.PeakMonthRecord peakMonthRecord = null;
        if (peakMonth != null && peakMonth.getMonthStart() != null) {
            LocalDate monthStart = peakMonth.getMonthStart().withDayOfMonth(1);
            Instant from = monthStart.atStartOfDay(ZONE).toInstant();
            Instant prevFrom = monthStart.minusMonths(1).atStartOfDay(ZONE).toInstant();
            BigDecimal prevAmount = toUsd(adminRevenueRepository.sumSuccessfulPaymentAmountBetween(prevFrom, from), usdToVnd);
            BigDecimal peakAmount = toUsd(peakMonth.getAmount(), usdToVnd);
            Double growth = PercentDeltaCalculator.percentDelta(prevAmount, peakAmount);
            peakMonthRecord = new AdminRevenueTransactionInsightsResponse.PeakMonthRecord(
                    monthStart.format(MONTH_LABEL),
                    peakAmount,
                    growth
            );
        }

        return new AdminRevenueTransactionInsightsResponse(metrics, peakDayRecord, peakMonthRecord);
    }

    private List<AdminRevenueOverviewResponse.CategoryBreakdownItem> buildCategoryBreakdown(BigDecimal usdToVnd) {
        List<AdminRevenueRepository.CategoryRevenueProjection> rows = adminRevenueRepository.findRevenueByCategory();
        BigDecimal total = rows.stream()
                .map(row -> nullToZero(row.getAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return rows.stream()
                .map(row -> {
                    BigDecimal amount = nullToZero(row.getAmount());
                    BigDecimal share = total.compareTo(BigDecimal.ZERO) == 0
                            ? BigDecimal.ZERO
                            : amount.multiply(BigDecimal.valueOf(100))
                            .divide(total, 2, RoundingMode.HALF_UP);
                    return new AdminRevenueOverviewResponse.CategoryBreakdownItem(
                            row.getCategoryId(),
                            row.getCategoryName(),
                            toUsd(amount, usdToVnd),
                            share
                    );
                })
                .toList();
    }

    private ChartWindow resolveChartWindow(String range) {
        LocalDate today = LocalDate.now(ZONE);
        return switch (range) {
            case "week" -> {
                LocalDate end = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                LocalDate start = end.minusWeeks(7);
                List<LocalDate> periods = new ArrayList<>();
                for (int i = 0; i < 8; i++) {
                    periods.add(start.plusWeeks(i));
                }
                yield new ChartWindow(
                        "week",
                        start.atStartOfDay(ZONE).toInstant(),
                        end.plusWeeks(1).atStartOfDay(ZONE).toInstant(),
                        periods
                );
            }
            case "month" -> {
                YearMonth end = YearMonth.from(today);
                YearMonth start = end.minusMonths(11);
                List<LocalDate> periods = new ArrayList<>();
                for (int i = 0; i < 12; i++) {
                    periods.add(start.plusMonths(i).atDay(1));
                }
                yield new ChartWindow(
                        "month",
                        start.atDay(1).atStartOfDay(ZONE).toInstant(),
                        end.plusMonths(1).atDay(1).atStartOfDay(ZONE).toInstant(),
                        periods
                );
            }
            case "year" -> {
                int endYear = today.getYear();
                int startYear = endYear - 4;
                List<LocalDate> periods = new ArrayList<>();
                for (int year = startYear; year <= endYear; year++) {
                    periods.add(LocalDate.of(year, 1, 1));
                }
                yield new ChartWindow(
                        "year",
                        LocalDate.of(startYear, 1, 1).atStartOfDay(ZONE).toInstant(),
                        LocalDate.of(endYear + 1, 1, 1).atStartOfDay(ZONE).toInstant(),
                        periods
                );
            }
            default -> {
                LocalDate start = today.minusDays(6);
                List<LocalDate> periods = new ArrayList<>();
                for (int i = 0; i < 7; i++) {
                    periods.add(start.plusDays(i));
                }
                yield new ChartWindow(
                        "day",
                        start.atStartOfDay(ZONE).toInstant(),
                        today.plusDays(1).atStartOfDay(ZONE).toInstant(),
                        periods
                );
            }
        };
    }

    private Map<LocalDate, BigDecimal> toPeriodMap(List<AdminRevenueRepository.PeriodAmountProjection> rows) {
        Map<LocalDate, BigDecimal> map = new LinkedHashMap<>();
        for (AdminRevenueRepository.PeriodAmountProjection row : rows) {
            if (row.getPeriod() == null) {
                continue;
            }
            map.put(row.getPeriod(), nullToZero(row.getAmount()));
        }
        return map;
    }

    private String formatPeriodLabel(LocalDate periodStart, String range) {
        return switch (range) {
            case "week" -> "W" + periodStart.format(DAY_LABEL);
            case "month" -> periodStart.format(MONTH_LABEL);
            case "year" -> String.valueOf(periodStart.getYear());
            default -> periodStart.format(DAY_LABEL);
        };
    }

    private LocalDate currentQuarterStart() {
        LocalDate today = LocalDate.now(ZONE);
        int month = ((today.getMonthValue() - 1) / 3) * 3 + 1;
        return LocalDate.of(today.getYear(), month, 1);
    }

    private String mapPaymentStatus(String dbStatus) {
        if (dbStatus == null) {
            return "Pending";
        }
        return switch (dbStatus.toUpperCase(Locale.ROOT)) {
            case "SUCCESS" -> "Successful";
            case "FAILED" -> "Failed";
            case "REFUNDED" -> "Refunded";
            default -> "Pending";
        };
    }

    private String normalizeEnumFilter(String value, Set<String> allowed) {
        String normalized = blankToNull(value);
        if (normalized == null) {
            return null;
        }
        String upper = normalized.trim().toUpperCase(Locale.ROOT);
        return allowed.contains(upper) ? upper : null;
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private BigDecimal nullToZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    /** Payments and payouts are persisted in VND; admin revenue is reported in USD. */
    private BigDecimal toUsd(BigDecimal amountVnd, BigDecimal usdToVnd) {
        BigDecimal amount = nullToZero(amountVnd);
        if (amount.signum() == 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.UNNECESSARY);
        }
        if (usdToVnd == null || usdToVnd.signum() <= 0) {
            throw new IllegalStateException("USD/VND exchange rate must be greater than zero");
        }
        return amount.divide(usdToVnd, 2, RoundingMode.HALF_UP);
    }

    private record ChartWindow(String bucket, Instant from, Instant to, List<LocalDate> periods) {}
}
