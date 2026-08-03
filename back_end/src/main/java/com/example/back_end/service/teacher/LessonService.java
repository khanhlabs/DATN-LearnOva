package com.example.back_end.service.teacher;

import com.example.back_end.service.MediaConvertService;

import com.example.back_end.dto.request.teacher.CreateLessonRequest;
import com.example.back_end.dto.request.teacher.UpdateLessonRequest;
import com.example.back_end.dto.request.teacher.UpdateLessonVideoRequest;
import com.example.back_end.entity.Lesson;
import com.example.back_end.entity.Section;
import com.example.back_end.entity.User;
import com.example.back_end.entity.enums.HlsStatus;
import com.example.back_end.exception.BusinessException;
import com.example.back_end.exception.ResourceNotFoundException;
import com.example.back_end.repository.LessonRepository;
import com.example.back_end.repository.SectionRepository;
import com.example.back_end.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class LessonService {

    private final LessonRepository lessonRepository;
    private final SectionRepository sectionRepository;
    private final MediaConvertService mediaConvertService;
    private final UserRepository userRepository;

    @Transactional
    public Long createLesson(
            Long sectionId,
            CreateLessonRequest request,
            String email
    ) {
        User instructor = userRepository
                .findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Section not found"));

        if (!section.getCourse().getInstructor().getId().equals(instructor.getId())) {
            throw new BusinessException("You don't have permission to modify this section");
        }

        Lesson lesson = new Lesson();

        lesson.setSection(section);
        lesson.setTitle(request.title());
        lesson.setLessonOrder(Double.valueOf(request.lessonOrder()));
        lesson.setIsPreview(request.isPreview());

        // Set default values for required fields
        lesson.setCreatedAt(Instant.now());
        lesson.setUpdatedAt(Instant.now());
        lesson.setIsDeleted(false);
        lesson.setViewCount(0);

        lessonRepository.save(lesson);

        return lesson.getId();
    }

    @Transactional
    public void updateLesson(Long lessonId, UpdateLessonRequest request, String email) {
        User instructor = userRepository
                .findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found"));

        if (!lesson.getSection().getCourse().getInstructor().getId().equals(instructor.getId())) {
            throw new BusinessException("You don't have permission to modify this lesson");
        }

        lesson.setTitle(request.title());
        lesson.setUpdatedAt(Instant.now());
        lessonRepository.save(lesson);
    }

    @Transactional
    public void updateLessonVideo(Long lessonId, UpdateLessonVideoRequest request, String email) {
        User instructor = userRepository
                .findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found"));

        if (!lesson.getSection().getCourse().getInstructor().getId().equals(instructor.getId())) {
            throw new BusinessException("You don't have permission to modify this lesson");
        }

        lesson.setVideoKey(request.videoKey());
        lesson.setVideoOriginalFilename(request.videoOriginalFilename());
        lesson.setVideoContentType(request.videoContentType());
        lesson.setVideoSizeBytes(request.videoSizeBytes());

        if (request.durationSeconds() != null) {
            lesson.setDurationSeconds(request.durationSeconds());
        }

        lesson.setUpdatedAt(Instant.now());

        if (request.videoKey() != null) {
            lesson.setHlsStatus(HlsStatus.PENDING);
            lesson.setMediaConvertJobId(null);
            lesson.setHlsPlaylistKey(null);

            try {
                String jobId = mediaConvertService.createHlsJob(request.videoKey(), lessonId);
                lesson.setMediaConvertJobId(jobId);
                lesson.setHlsStatus(HlsStatus.PROCESSING);
            } catch (Exception e) {
                lesson.setHlsStatus(HlsStatus.FAILED);
                log.warn("Failed to create MediaConvert job for lesson {}", lessonId, e);
            }
        }

        lessonRepository.save(lesson);
    }

}
