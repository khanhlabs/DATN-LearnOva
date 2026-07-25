package com.example.back_end.service.admin;

import com.example.back_end.entity.Lesson;
import com.example.back_end.entity.enums.HlsStatus;
import com.example.back_end.repository.LessonRepository;
import com.example.back_end.service.MediaConvertService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminHlsMigrationService {

    private final LessonRepository lessonRepository;
    private final MediaConvertService mediaConvertService;

    // TODO: chưa có MediaConvert key, comment tạm để app chạy được. Bỏ comment khi có key.
    /*
    @Transactional
    public int migrateAllPendingLessons() {
        List<Lesson> legacyLessons = lessonRepository.findByVideoKeyIsNotNullAndHlsStatusIsNull();

        int triggered = 0;
        for (Lesson lesson : legacyLessons) {
            try {
                String jobId = mediaConvertService.createHlsJob(lesson.getVideoKey(), lesson.getId());
                lesson.setMediaConvertJobId(jobId);
                lesson.setHlsStatus(HlsStatus.PENDING);
                lessonRepository.save(lesson);
                triggered++;
            } catch (Exception e) {
                log.warn("Failed to trigger HLS migration job for lesson {}", lesson.getId(), e);
            }
        }

        log.info("Triggered HLS migration for {} legacy lessons", triggered);
        return triggered;
    }
    */

}
