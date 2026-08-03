package com.example.back_end.service;

import com.example.back_end.dto.response.LessonSummaryResponse;
import com.example.back_end.entity.Lesson;
import com.example.back_end.entity.LessonSummary;
import com.example.back_end.exception.BusinessException;
import com.example.back_end.exception.ResourceNotFoundException;
import com.example.back_end.repository.LessonRepository;
import com.example.back_end.repository.LessonSummaryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LessonSummaryService {

    private final LessonSummaryRepository summaryRepo;
    private final LessonRepository lessonRepo;
    private final S3Service s3Service;
    private final AiServiceClient aiServiceClient;

    public LessonSummaryResponse getSummary(Long lessonId) {
        LessonSummary summary = summaryRepo.findByLessonId(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("No summary yet for lesson " + lessonId));
        return toResponse(summary);
    }

    @Transactional
    public LessonSummaryResponse generateSummary(Long lessonId) {
        Lesson lesson = lessonRepo.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found: " + lessonId));

        if (lesson.getVideoKey() == null) {
            throw new BusinessException("This lesson has no video uploaded yet.");
        }

        LessonSummary summary = summaryRepo.findByLessonId(lessonId).orElseGet(LessonSummary::new);
        if (summary.getId() != null) {
            return toResponse(summary);
        }

        byte[] videoBytes = s3Service.readObjectBytes(lesson.getVideoKey());
        String content = aiServiceClient.summarizeVideo(
                videoBytes,
                lesson.getVideoOriginalFilename() != null ? lesson.getVideoOriginalFilename() : "lesson.mp4",
                lesson.getVideoContentType()
        );

        Instant now = Instant.now();
        summary.setLesson(lesson);
        summary.setContent(content);
        summary.setCreatedAt(now);
        summary.setUpdatedAt(now);

        summary = summaryRepo.save(summary);
        return toResponse(summary);
    }

    private LessonSummaryResponse toResponse(LessonSummary summary) {
        return new LessonSummaryResponse(
                summary.getLesson().getId(),
                summary.getContent(),
                summary.getUpdatedAt()
        );
    }
}
