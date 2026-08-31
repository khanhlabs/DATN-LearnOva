package com.example.back_end.ai.infrastructure.persistence;

import com.example.back_end.ai.domain.AiGenerationJob;
import com.example.back_end.ai.domain.AiGenerationStatus;
import com.example.back_end.ai.domain.AiGenerationType;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface AiGenerationJobRepository extends JpaRepository<AiGenerationJob, Long> {
    Optional<AiGenerationJob> findByLessonIdAndGenerationTypeAndVideoKey(
            Long lessonId, AiGenerationType generationType, String videoKey);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<AiGenerationJob> findFirstByStatusOrderByRequestedAtAsc(AiGenerationStatus status);

    Optional<AiGenerationJob> findFirstByLessonIdAndGenerationTypeOrderByRequestedAtDesc(
            Long lessonId, AiGenerationType generationType);

    List<AiGenerationJob> findByStatusAndStartedAtBefore(AiGenerationStatus status, Instant startedBefore);
}
