package com.example.back_end.scheduler;

import com.example.back_end.entity.Lesson;
import com.example.back_end.entity.enums.HlsStatus;
import com.example.back_end.repository.LessonRepository;
import com.example.back_end.service.MediaConvertService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import software.amazon.awssdk.services.mediaconvert.model.JobStatus;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class HlsJobStatusScheduler {

    private final LessonRepository lessonRepository;
    private final MediaConvertService mediaConvertService;

    @Scheduled(fixedDelay = 30_000)
    @Transactional
    public void pollPendingJobs() {
        List<Lesson> pending = lessonRepository.findByHlsStatusIn(
                List.of(HlsStatus.PENDING, HlsStatus.PROCESSING)
        );

        for (Lesson lesson : pending) {
            if (lesson.getMediaConvertJobId() == null) {
                continue;
            }

            JobStatus status;
            try {
                status = mediaConvertService.getJobStatus(lesson.getMediaConvertJobId());
            } catch (Exception e) {
                log.warn("Failed to poll MediaConvert job {} for lesson {}", lesson.getMediaConvertJobId(), lesson.getId(), e);
                continue;
            }

            switch (status) {
                case COMPLETE -> {
                    String videoUuid = MediaConvertService.videoUuidFromKey(lesson.getVideoKey());
                    lesson.setHlsPlaylistKey(MediaConvertService.HLS_OUTPUT_PREFIX + videoUuid + "/"
                            + MediaConvertService.HLS_BASE_FILENAME + ".m3u8");
                    lesson.setHlsStatus(HlsStatus.READY);
                    lessonRepository.save(lesson);
                    log.info("HLS ready for lesson {}", lesson.getId());
                }
                case ERROR, CANCELED -> {
                    lesson.setHlsStatus(HlsStatus.FAILED);
                    lessonRepository.save(lesson);
                    log.warn("HLS job failed for lesson {}", lesson.getId());
                }
                case PROGRESSING, SUBMITTED -> {
                    lesson.setHlsStatus(HlsStatus.PROCESSING);
                    lessonRepository.save(lesson);
                }
                default -> { }
            }
        }
    }

}
