package com.example.back_end.service.admin;

import com.example.back_end.dto.response.admin.AdminDashboardResponse;
import com.example.back_end.repository.admin.AdminCourseRepository;
import com.example.back_end.repository.admin.AdminUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private static final List<String> MONTH_LABELS = List.of(
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
    );

    private final AdminUserRepository adminUserRepository;
    private final AdminCourseRepository adminCourseRepository;

    @Transactional(readOnly = true)
    public AdminDashboardResponse getDashboard(Integer year) {
        int selectedYear = year != null ? year : LocalDate.now(ZoneOffset.UTC).getYear();
        long totalUsers = adminUserRepository.countByIsDeletedFalse();
        long totalTeachers = adminUserRepository.countActiveTeachers();
        long totalCourses = adminCourseRepository.countByIsDeletedFalse();
        BigDecimal totalRevenue = adminCourseRepository.sumPaidRevenue();

        return new AdminDashboardResponse(
                new AdminDashboardResponse.Statistics(
                        totalUsers,
                        totalTeachers,
                        totalCourses,
                        totalRevenue == null ? BigDecimal.ZERO : totalRevenue
                ),
                getGrowthSeries(selectedYear),
                getRoleDistribution(),
                getRecentUsers(),
                getFeaturedInstructors(),
                getRecentActivity()
        );
    }

    private List<AdminDashboardResponse.GrowthPoint> getGrowthSeries(int year) {
        Map<Integer, Long> totalsByMonth = new LinkedHashMap<>();

        for (Object[] row : adminUserRepository.countActiveUsersByMonth(year)) {
            totalsByMonth.put(toInt(row[0]), toLong(row[1]));
        }

        return MONTH_LABELS.stream()
                .map(month -> {
                    int monthNumber = MONTH_LABELS.indexOf(month) + 1;
                    return new AdminDashboardResponse.GrowthPoint(
                            month,
                            totalsByMonth.getOrDefault(monthNumber, 0L)
                    );
                })
                .toList();
    }

    private List<AdminDashboardResponse.RoleDistributionItem> getRoleDistribution() {
        Map<String, Long> totals = new LinkedHashMap<>();
        totals.put("ROLE_USER", 0L);
        totals.put("ROLE_TEACHER", 0L);
        totals.put("ROLE_ADMIN", 0L);

        for (Object[] row : adminUserRepository.countActiveUsersByRoleName()) {
            totals.put(String.valueOf(row[0]), toLong(row[1]));
        }

        return List.of(
                new AdminDashboardResponse.RoleDistributionItem("Students", totals.get("ROLE_USER")),
                new AdminDashboardResponse.RoleDistributionItem("Instructors", totals.get("ROLE_TEACHER")),
                new AdminDashboardResponse.RoleDistributionItem("Administrators", totals.get("ROLE_ADMIN"))
        );
    }

    private List<AdminDashboardResponse.RecentUser> getRecentUsers() {
        return adminUserRepository.findRecentActiveUserRows()
                .stream()
                .map(row -> new AdminDashboardResponse.RecentUser(
                        toLong(row[0]),
                        firstPresent((String) row[1], (String) row[2], "User #" + row[0]),
                        firstPresent((String) row[2], "-", "-"),
                        getRoleLabel(String.valueOf(row[3]))
                ))
                .toList();
    }

    private List<AdminDashboardResponse.FeaturedInstructor> getFeaturedInstructors() {
        List<Object[]> rows = adminCourseRepository.findFeaturedInstructorRows();

        return rows.stream()
                .map(row -> {
                    int rank = rows.indexOf(row) + 1;
                    BigDecimal averageRating = toBigDecimal(row[5]).setScale(1, RoundingMode.HALF_UP);

                    return new AdminDashboardResponse.FeaturedInstructor(
                            toLong(row[0]),
                            firstPresent((String) row[1], (String) row[2], "Instructor #" + row[0]),
                            toLong(row[4]),
                            averageRating.doubleValue(),
                            rank,
                            firstPresent((String) row[3], "", "")
                    );
                })
                .toList();
    }

    private List<AdminDashboardResponse.ActivityItem> getRecentActivity() {
        List<ActivityRow> rows = new ArrayList<>();

        for (Object[] row : adminUserRepository.findRecentUserActivityRows()) {
            String role = String.valueOf(row[4]);
            String label = "ROLE_TEACHER".equals(role) ? "New instructor" : "New user";

            rows.add(new ActivityRow(
                    "user-" + row[0],
                    label,
                    firstPresent((String) row[1], (String) row[2], "User #" + row[0]),
                    toInstant(row[3])
            ));
        }

        for (Object[] row : adminCourseRepository.findRecentCourseActivityRows()) {
            rows.add(new ActivityRow(
                    "course-" + row[0],
                    "New course",
                    firstPresent((String) row[1], "", "Course #" + row[0]),
                    toInstant(row[2])
            ));
        }

        return rows.stream()
                .filter(row -> row.createdAt() != null)
                .sorted(Comparator.comparing(ActivityRow::createdAt).reversed())
                .limit(4)
                .map(row -> new AdminDashboardResponse.ActivityItem(
                        row.id(),
                        row.label(),
                        row.title(),
                        formatRelativeTime(row.createdAt())
                ))
                .toList();
    }

    private String getRoleLabel(String roleName) {
        return switch (roleName) {
            case "ROLE_ADMIN" -> "Administrator";
            case "ROLE_TEACHER" -> "Instructor";
            default -> "Student";
        };
    }

    private String firstPresent(String first, String second, String fallback) {
        if (first != null && !first.isBlank()) {
            return first;
        }
        if (second != null && !second.isBlank()) {
            return second;
        }
        return fallback;
    }

    private int toInt(Object value) {
        return value instanceof Number number ? number.intValue() : 0;
    }

    private long toLong(Object value) {
        return value instanceof Number number ? number.longValue() : 0L;
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value instanceof BigDecimal decimal) {
            return decimal;
        }
        if (value instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue());
        }
        return BigDecimal.ZERO;
    }

    private Instant toInstant(Object value) {
        if (value instanceof Instant instant) {
            return instant;
        }
        if (value instanceof Timestamp timestamp) {
            return timestamp.toInstant();
        }
        return null;
    }

    private String formatRelativeTime(Instant value) {
        long minutes = ChronoUnit.MINUTES.between(value, Instant.now());

        if (minutes < 1) {
            return "Just now";
        }
        if (minutes < 60) {
            return minutes + "m ago";
        }

        long hours = minutes / 60;
        if (hours < 24) {
            return hours + "h ago";
        }

        long days = hours / 24;
        if (days < 7) {
            return days + "d ago";
        }

        return LocalDate.ofInstant(value, ZoneOffset.UTC).toString();
    }

    private record ActivityRow(
            String id,
            String label,
            String title,
            Instant createdAt
    ) {
    }
}
