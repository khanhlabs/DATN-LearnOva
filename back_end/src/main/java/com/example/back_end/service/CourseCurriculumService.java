package com.example.back_end.service;

import com.example.back_end.dto.response.CourseCurriculumResponse;
import com.example.back_end.dto.response.LessonResponse;
import com.example.back_end.dto.response.SectionResponse;
import com.example.back_end.entity.Course;
import com.example.back_end.entity.Lesson;
import com.example.back_end.entity.Section;
import com.example.back_end.repository.CourseRepository;
import com.example.back_end.repository.LessonRepository;
import com.example.back_end.repository.LessonProgressRepository;
import com.example.back_end.repository.SectionRepository;
import com.example.back_end.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseCurriculumService {

    private final CourseRepository courseRepository;
    private final SectionRepository sectionRepository;
    private final LessonRepository lessonRepository;
    private final LessonProgressRepository lessonProgressRepository;

    @Transactional(readOnly = true)
    public CourseCurriculumResponse getCourseCurriculum(Long courseId) {

        Long userId = getCurrentUserId();

        Course course = courseRepository.findCourseDetailById(courseId)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

        List<Section> sections =
                sectionRepository.findByCourseIdOrderBySectionOrderAsc(courseId);

        List<SectionResponse> curriculum = sections.stream()
                .map(section -> {

                    List<Lesson> lessons =
                            lessonRepository.findBySectionIdOrderByLessonOrderAsc(section.getId());

                    List<LessonResponse> lessonResponses = lessons.stream()
                            .map(lesson -> {

                                boolean completed =
                                        lessonProgressRepository
                                                .existsByUser_IdAndLesson_IdAndIsCompletedTrue(
                                                        userId,
                                                        lesson.getId()
                                                );

                                String duration = formatDuration(lesson.getDurationSeconds());

                                return new LessonResponse(
                                        lesson.getId(),
                                        lesson.getTitle(),
                                        duration,
                                        completed
                                );

                            })
                            .toList();

                    int totalLessons = lessonResponses.size();

                    int completedLessons = (int) lessonResponses.stream()
                            .filter(LessonResponse::completed)
                            .count();

                    int percent = totalLessons == 0
                            ? 0
                            : completedLessons * 100 / totalLessons;

                    return new SectionResponse(
                            section.getId(),
                            section.getTitle(),
                            completedLessons,
                            totalLessons,
                            percent,
                            lessonResponses
                    );

                })
                .toList();

        int totalLessons = curriculum.stream()
                .mapToInt(SectionResponse::totalLessons)
                .sum();

        return new CourseCurriculumResponse(
                course.getId(),
                course.getTitle(),
                curriculum.size(),
                totalLessons,
                curriculum
        );
    }

    private String formatDuration(Integer seconds) {

        if (seconds == null) {
            return "00:00";
        }

        int minutes = seconds / 60;
        int remainSeconds = seconds % 60;

        return String.format("%02d:%02d", minutes, remainSeconds);
    }

    private Long getCurrentUserId() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        Object principal =
                authentication == null ? null : authentication.getPrincipal();

        if (principal instanceof CustomUserDetails userDetails) {
            return userDetails.getId();
        }

        throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Authentication required"
        );
    }
}