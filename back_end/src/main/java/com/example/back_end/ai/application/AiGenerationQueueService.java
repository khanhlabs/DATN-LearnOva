package com.example.back_end.ai.application;

import com.example.back_end.ai.adapter.in.web.dto.AiGenerationJobStatusResponse;
import com.example.back_end.ai.domain.AiGenerationJob;
import com.example.back_end.ai.domain.AiGenerationStatus;
import com.example.back_end.ai.domain.AiGenerationType;
import com.example.back_end.ai.infrastructure.persistence.AiGenerationJobRepository;
import com.example.back_end.assessment.infrastructure.persistence.QuizRepository;
import com.example.back_end.course.domain.Lesson;
import com.example.back_end.course.infrastructure.persistence.LessonRepository;
import com.example.back_end.learning.infrastructure.persistence.LessonSummaryRepository;
import com.example.back_end.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AiGenerationQueueService {
    private final AiGenerationJobRepository jobRepository;
    private final LessonRepository lessonRepository;
    private final LessonSummaryRepository summaryRepository;
    private final QuizRepository quizRepository;

    @Transactional
    public void queueForVideo(Long lessonId, String videoKey) {
        if (videoKey == null || videoKey.isBlank()) return;
        Lesson lesson = lessonRepository.getReferenceById(lessonId);
        Arrays.stream(AiGenerationType.values())
                .forEach(type -> createIfAbsent(lesson, type, videoKey));
    }

    @Transactional
    public List<AiGenerationJobStatusResponse> getStatus(Long lessonId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found: " + lessonId));

        if (lesson.getVideoKey() != null) {
            if (summaryRepository.findByLessonId(lessonId).isEmpty()) {
                createIfAbsent(lesson, AiGenerationType.SUMMARY, lesson.getVideoKey());
            }
            if (quizRepository.findByLessonId(lessonId).isEmpty()) {
                createIfAbsent(lesson, AiGenerationType.QUIZ, lesson.getVideoKey());
            }
        }

        return Arrays.stream(AiGenerationType.values())
                .map(type -> jobRepository.findFirstByLessonIdAndGenerationTypeOrderByRequestedAtDesc(lessonId, type)
                        .map(this::toResponse)
                        .orElse(new AiGenerationJobStatusResponse(type, AiGenerationStatus.QUEUED, 0, Instant.now())))
                .toList();
    }

    @Transactional
    public AiGenerationJob claimNextJob() {
        return jobRepository.findFirstByStatusOrderByRequestedAtAsc(AiGenerationStatus.QUEUED)
                .map(job -> {
                    Instant now = Instant.now();
                    job.setStatus(AiGenerationStatus.PROCESSING);
                    job.setAttempts(job.getAttempts() + 1);
                    job.setStartedAt(now);
                    job.setUpdatedAt(now);
                    return jobRepository.save(job);
                })
                .orElse(null);
    }

    @Transactional
    public void complete(Long jobId) {
        updateTerminalStatus(jobId, AiGenerationStatus.COMPLETED, null);
    }

    @Transactional
    public void fail(Long jobId, String error) {
        AiGenerationJob job = jobRepository.findById(jobId).orElseThrow();
        Instant now = Instant.now();
        job.setErrorMessage(error == null ? "Unknown AI generation error" : error.substring(0, Math.min(error.length(), 2000)));
        job.setUpdatedAt(now);
        job.setCompletedAt(now);
        job.setStatus(job.getAttempts() >= 3 ? AiGenerationStatus.FAILED : AiGenerationStatus.QUEUED);
        jobRepository.save(job);
    }

    @Transactional
    public void recoverStalledJobs() {
        Instant staleBefore = Instant.now().minusSeconds(15 * 60);
        for (AiGenerationJob job : jobRepository.findByStatusAndStartedAtBefore(AiGenerationStatus.PROCESSING, staleBefore)) {
            job.setStatus(AiGenerationStatus.QUEUED);
            job.setErrorMessage("Worker restarted while processing; queued again.");
            job.setUpdatedAt(Instant.now());
        }
    }

    private void createIfAbsent(Lesson lesson, AiGenerationType type, String videoKey) {
        if (jobRepository.findByLessonIdAndGenerationTypeAndVideoKey(lesson.getId(), type, videoKey).isPresent()) return;
        Instant now = Instant.now();
        AiGenerationJob job = new AiGenerationJob();
        job.setLesson(lesson);
        job.setGenerationType(type);
        job.setVideoKey(videoKey);
        job.setStatus(AiGenerationStatus.QUEUED);
        job.setAttempts(0);
        job.setRequestedAt(now);
        job.setUpdatedAt(now);
        jobRepository.save(job);
    }

    private void updateTerminalStatus(Long jobId, AiGenerationStatus status, String error) {
        AiGenerationJob job = jobRepository.findById(jobId).orElseThrow();
        Instant now = Instant.now();
        job.setStatus(status);
        job.setErrorMessage(error);
        job.setCompletedAt(now);
        job.setUpdatedAt(now);
        jobRepository.save(job);
    }

    private AiGenerationJobStatusResponse toResponse(AiGenerationJob job) {
        return new AiGenerationJobStatusResponse(
                job.getGenerationType(), job.getStatus(), job.getAttempts(), job.getUpdatedAt());
    }
}
