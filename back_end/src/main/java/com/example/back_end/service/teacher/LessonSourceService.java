package com.example.back_end.service.teacher;

import com.example.back_end.dto.request.teacher.CreateLessonSourceRequest;
import com.example.back_end.dto.response.teacher.LessonSourceResponse;
import com.example.back_end.entity.Lesson;
import com.example.back_end.entity.LessonSource;
import com.example.back_end.entity.User;
import com.example.back_end.exception.BusinessException;
import com.example.back_end.exception.ResourceNotFoundException;
import com.example.back_end.repository.LessonRepository;
import com.example.back_end.repository.teacher.LessonSourceRepository;
import com.example.back_end.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class LessonSourceService {

    private final LessonSourceRepository lessonSourceRepository;
    private final LessonRepository lessonRepository;
    private final UserRepository userRepository;

    private User requireInstructor(String email) {
        return userRepository
                .findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Transactional
    public LessonSourceResponse createLessonSource(Long lessonId, CreateLessonSourceRequest request, String email) {
        User instructor = requireInstructor(email);

        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found"));

        if (!lesson.getSection().getCourse().getInstructor().getId().equals(instructor.getId())) {
            throw new BusinessException("You don't have permission to modify this lesson");
        }

        LessonSource lessonSource = new LessonSource();
        lessonSource.setLesson(lesson);
        lessonSource.setFileKey(request.fileKey());
        lessonSource.setOriginalFileName(request.originalFileName());
        lessonSource.setFileName(request.originalFileName()); // Copy to file_name as well
        lessonSource.setContentType(request.contentType());
        lessonSource.setFileSizeBytes(request.fileSizeBytes());
        lessonSource.setResourceType(request.resourceType());
        lessonSource.setCreatedAt(Instant.now());

        lessonSourceRepository.save(lessonSource);

        return new LessonSourceResponse(
                lessonSource.getId(),
                lessonSource.getFileKey(),
                lessonSource.getOriginalFileName(),
                lessonSource.getResourceType()
        );
    }

    @Transactional(readOnly = true)
    public List<LessonSourceResponse> getLessonSources(Long lessonId, String email) {
        User instructor = requireInstructor(email);

        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found"));

        if (!lesson.getSection().getCourse().getInstructor().getId().equals(instructor.getId())) {
            throw new BusinessException("You don't have permission to view this lesson");
        }

        return lessonSourceRepository.findByLessonId(lessonId)
                .stream()
                .map(source -> new LessonSourceResponse(
                        source.getId(),
                        source.getFileKey(),
                        source.getOriginalFileName(),
                        source.getResourceType()
                ))
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteLessonSource(Long sourceId, String email) {
        User instructor = requireInstructor(email);

        LessonSource lessonSource = lessonSourceRepository.findById(sourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson source not found"));

        if (!lessonSource.getLesson().getSection().getCourse().getInstructor().getId().equals(instructor.getId())) {
            throw new BusinessException("You don't have permission to delete this lesson source");
        }

        lessonSourceRepository.deleteById(sourceId);
    }
}
