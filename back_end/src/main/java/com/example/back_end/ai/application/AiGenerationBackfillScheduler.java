package com.example.back_end.ai.application;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AiGenerationBackfillScheduler {
    private final AiGenerationQueueService queueService;

    @Value("${ai.generation.backfill-enabled:true}")
    private boolean backfillEnabled;

    @Value("${ai.generation.backfill-batch-size:10}")
    private int batchSize;

    @Scheduled(fixedDelayString = "${ai.generation.backfill-interval-ms:60000}")
    public void queueLegacyLessons() {
        if (!backfillEnabled) return;

        int createdJobs = queueService.queueMissingLegacyLessons(batchSize);
        if (createdJobs > 0) {
            log.info("Queued {} AI generation jobs for legacy lessons", createdJobs);
        }
    }
}
