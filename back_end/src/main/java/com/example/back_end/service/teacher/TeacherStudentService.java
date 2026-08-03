package com.example.back_end.service.teacher;

import com.example.back_end.dto.response.teacher.TeacherStudentCourseResponse;
import com.example.back_end.dto.response.teacher.TeacherStudentResponse;
import com.example.back_end.entity.Enrollment;
import com.example.back_end.entity.User;
import com.example.back_end.exception.ResourceNotFoundException;
import com.example.back_end.repository.EnrollmentRepository;
import com.example.back_end.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TeacherStudentService {

    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;

    @Transactional(readOnly = true)
    public List<TeacherStudentResponse> getMyStudents(String email) {
        User instructor = userRepository
                .findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Enrollment> enrollments = enrollmentRepository.findByInstructorId(instructor.getId());

        // Group enrollments by student, preserving earliest enrolledAt
        Map<Long, List<Enrollment>> byStudent = enrollments.stream()
                .collect(Collectors.groupingBy(e -> e.getUser().getId()));

        return byStudent.entrySet().stream()
                .map(entry -> {
                    List<Enrollment> studentEnrollments = entry.getValue();
                    User student = studentEnrollments.get(0).getUser();

                    List<TeacherStudentCourseResponse> courses = studentEnrollments.stream()
                            .map(e -> new TeacherStudentCourseResponse(
                                    e.getCourse().getId(),
                                    e.getCourse().getTitle(),
                                    e.getProgressPercent() != null ? e.getProgressPercent() : 0,
                                    e.getEnrolledAt()
                            ))
                            .toList();

                    Instant earliestEnrolledAt = studentEnrollments.stream()
                            .map(Enrollment::getEnrolledAt)
                            .min(Comparator.naturalOrder())
                            .orElse(null);

                    int avgProgress = (int) studentEnrollments.stream()
                            .mapToInt(e -> e.getProgressPercent() != null ? e.getProgressPercent() : 0)
                            .average()
                            .orElse(0);

                    String status = avgProgress == 0 ? "NOT_STARTED"
                            : avgProgress == 100 ? "COMPLETED"
                            : "IN_PROGRESS";

                    return new TeacherStudentResponse(
                            student.getId(),
                            student.getFullName(),
                            student.getEmail(),
                            student.getPhone(),
                            student.getAvatar(),
                            courses,
                            earliestEnrolledAt,
                            avgProgress,
                            status
                    );
                })
                .sorted(Comparator.comparing(
                        TeacherStudentResponse::enrolledAt,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ))
                .toList();
    }
}
