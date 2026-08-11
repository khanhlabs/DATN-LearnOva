package com.example.back_end.admin.adapter.in.web.dto;

import java.math.BigDecimal;

public record AdminRevenueInstructorRankingResponse(
        Long instructorId,
        String instructor,
        Long totalCourses,
        Long totalStudents,
        BigDecimal revenue,
        BigDecimal avgPerCourse,
        BigDecimal share
) {}
