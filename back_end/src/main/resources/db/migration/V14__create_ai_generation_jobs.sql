CREATE TABLE public.ai_generation_jobs (
    job_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    lesson_id BIGINT NOT NULL REFERENCES public.lessons(lesson_id) ON DELETE CASCADE,
    generation_type VARCHAR(20) NOT NULL,
    video_key TEXT NOT NULL,
    status VARCHAR(20) NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ai_generation_jobs_type_check CHECK (generation_type IN ('SUMMARY', 'QUIZ')),
    CONSTRAINT ai_generation_jobs_status_check CHECK (status IN ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')),
    CONSTRAINT ai_generation_jobs_lesson_type_video_key UNIQUE (lesson_id, generation_type, video_key)
);

CREATE INDEX ai_generation_jobs_status_requested_at_idx
    ON public.ai_generation_jobs (status, requested_at);
