CREATE OR REPLACE FUNCTION public.sync_enrollment_progress()
    RETURNS trigger
    LANGUAGE plpgsql
AS $$
DECLARE
    v_course_id      BIGINT;
    v_total_lessons  INTEGER;
    v_done_lessons   INTEGER;
    v_new_percent    INTEGER;
BEGIN
    -- Xác định course từ lesson
    SELECT s.course_id
    INTO v_course_id
    FROM lessons l
             JOIN sections s ON l.section_id = s.section_id
    WHERE l.lesson_id = NEW.lesson_id;

    -- Tổng số lesson của course
    SELECT COUNT(*)
    INTO v_total_lessons
    FROM lessons l
             JOIN sections s ON l.section_id = s.section_id
    WHERE s.course_id = v_course_id
      AND l.is_deleted = FALSE
      AND s.is_deleted = FALSE;

    -- Số lesson user đã hoàn thành
    SELECT COUNT(*)
    INTO v_done_lessons
    FROM lesson_progress lp
             JOIN lessons l ON lp.lesson_id = l.lesson_id
             JOIN sections s ON l.section_id = s.section_id
    WHERE lp.user_id = NEW.user_id
      AND s.course_id = v_course_id
      AND lp.is_completed = TRUE
      AND l.is_deleted = FALSE
      AND s.is_deleted = FALSE;

    -- Tính progress
    IF v_total_lessons = 0 THEN
        v_new_percent := 0;
    ELSE
        v_new_percent := FLOOR(v_done_lessons * 100.0 / v_total_lessons);
    END IF;

    -- Cập nhật enrollment
    UPDATE enrollments
    SET progress_percent = v_new_percent,
        completed_at = CASE
                           WHEN v_new_percent = 100 AND completed_at IS NULL THEN CURRENT_TIMESTAMP
                           WHEN v_new_percent < 100 THEN NULL
                           ELSE completed_at
            END
    WHERE user_id = NEW.user_id
      AND course_id = v_course_id;

    RETURN NEW;
END;
$$;