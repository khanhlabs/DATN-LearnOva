package com.example.back_end.ai.application;

import com.example.back_end.ai.domain.AiGenerationJob;
import com.example.back_end.ai.domain.AiGenerationType;
import com.example.back_end.assessment.application.QuizService;
import com.example.back_end.course.infrastructure.persistence.LessonRepository;
import com.example.back_end.learning.application.LessonSummaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AiGenerationWorker {
    private final AiGenerationQueueService queueService;
    private final LessonRepository lessonRepository;
    private final LessonSummaryService lessonSummaryService;
    private final QuizService quizService;

    @Scheduled(fixedDelayString = "${ai.generation.poll-interval-ms:5000}")
    public void processOneJob() {
        queueService.recoverStalledJobs();
        AiGenerationJob job = queueService.claimNextJob();
        if (job == null) return;

        try {
            String currentVideoKey = lessonRepository.findById(job.getLesson().getId())
                    .map(lesson -> lesson.getVideoKey())
                    .orElse(null);
            if (!job.getVideoKey().equals(currentVideoKey)) {
                queueService.complete(job.getId());
                return;
            }

            if (job.getGenerationType() == AiGenerationType.SUMMARY) {
                lessonSummaryService.regenerateSummary(job.getLesson().getId());
            } else {
                quizService.regenerateQuiz(job.getLesson().getId());
            }
            queueService.complete(job.getId());
        } catch (Exception exception) {
            log.warn("AI generation job {} failed", job.getId(), exception);
            queueService.fail(job.getId(), exception.getMessage());
        }
    }
}
