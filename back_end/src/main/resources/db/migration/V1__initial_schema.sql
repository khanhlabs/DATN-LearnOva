--
-- PostgreSQL database dump
--

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: account_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.account_type AS ENUM (
    'LOCAL',
    'GOOGLE',
    'FACEBOOK',
    'GITHUB'
);


--
-- Name: accounttype; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.accounttype AS ENUM (
    'FACEBOOK',
    'GITHUB',
    'GOOGLE',
    'LOCAL'
);


--
-- Name: course_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.course_level AS ENUM (
    'Beginner',
    'Intermediate',
    'Advanced'
);


--
-- Name: course_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.course_status AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'ARCHIVED',
    'REJECTED',
    'PENDING_REVIEW',
    'DELETED'
);


--
-- Name: courselevel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.courselevel AS ENUM (
    'Advanced',
    'Beginner',
    'Intermediate'
);


--
-- Name: coursestatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.coursestatus AS ENUM (
    'ARCHIVED',
    'DRAFT',
    'PUBLISHED'
);


--
-- Name: discount_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.discount_type AS ENUM (
    'Fixed',
    'Percent'
);


--
-- Name: discounttype; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.discounttype AS ENUM (
    'Fixed',
    'Percent'
);


--
-- Name: gender_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.gender_type AS ENUM (
    'Male',
    'Female',
    'Other'
);


--
-- Name: gendertype; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.gendertype AS ENUM (
    'Female',
    'Male',
    'Other'
);


--
-- Name: lesson_source_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.lesson_source_type AS ENUM (
    'Documentary',
    'Resources'
);


--
-- Name: lessonsourcetype; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.lessonsourcetype AS ENUM (
    'Documentary',
    'Resources'
);


--
-- Name: order_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.order_status AS ENUM (
    'PENDING',
    'PAID',
    'FAILED',
    'CANCELLED'
);


--
-- Name: orderstatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.orderstatus AS ENUM (
    'CANCELLED',
    'FAILED',
    'PAID',
    'PENDING'
);


--
-- Name: payment_method; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_method AS ENUM (
    'MOMO',
    'VNPAY',
    'PAYPAL',
    'PAYOS'
);


--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_status AS ENUM (
    'PENDING',
    'SUCCESS',
    'FAILED',
    'REFUNDED'
);


--
-- Name: paymentmethod; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.paymentmethod AS ENUM (
    'MOMO',
    'PAYPAL',
    'VNPAY'
);


--
-- Name: paymentstatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.paymentstatus AS ENUM (
    'FAILED',
    'PENDING',
    'REFUNDED',
    'SUCCESS'
);


--
-- Name: role_name; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.role_name AS ENUM (
    'ROLE_ADMIN',
    'ROLE_TEACHER',
    'ROLE_USER'
);


--
-- Name: rolename; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.rolename AS ENUM (
    'ROLE_ADMIN',
    'ROLE_TEACHER',
    'ROLE_USER'
);


--
-- Name: verification_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.verification_type AS ENUM (
    'ACTIVE_ACCOUNT',
    'RESET_PASSWORD',
    'REFRESH_TOKEN'
);


--
-- Name: verificationtype; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.verificationtype AS ENUM (
    'ACTIVE_ACCOUNT',
    'RESET_PASSWORD'
);


--
-- Name: CAST (public.accounttype AS character varying); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (public.accounttype AS character varying) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (public.courselevel AS character varying); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (public.courselevel AS character varying) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (public.coursestatus AS character varying); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (public.coursestatus AS character varying) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (public.discounttype AS character varying); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (public.discounttype AS character varying) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (public.gendertype AS character varying); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (public.gendertype AS character varying) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (public.lessonsourcetype AS character varying); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (public.lessonsourcetype AS character varying) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (public.orderstatus AS character varying); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (public.orderstatus AS character varying) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (public.paymentmethod AS character varying); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (public.paymentmethod AS character varying) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (public.paymentstatus AS character varying); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (public.paymentstatus AS character varying) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (public.rolename AS character varying); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (public.rolename AS character varying) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (character varying AS public.accounttype); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (character varying AS public.accounttype) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (character varying AS public.courselevel); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (character varying AS public.courselevel) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (character varying AS public.coursestatus); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (character varying AS public.coursestatus) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (character varying AS public.discounttype); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (character varying AS public.discounttype) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (character varying AS public.gendertype); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (character varying AS public.gendertype) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (character varying AS public.lessonsourcetype); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (character varying AS public.lessonsourcetype) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (character varying AS public.orderstatus); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (character varying AS public.orderstatus) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (character varying AS public.paymentmethod); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (character varying AS public.paymentmethod) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (character varying AS public.paymentstatus); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (character varying AS public.paymentstatus) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (character varying AS public.rolename); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (character varying AS public.rolename) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (character varying AS public.verificationtype); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (character varying AS public.verificationtype) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (public.verificationtype AS character varying); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (public.verificationtype AS character varying) WITH INOUT AS IMPLICIT;


--
-- Name: check_lesson_progress_enrollment(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_lesson_progress_enrollment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_course_id BIGINT;
BEGIN
    SELECT s.course_id INTO v_course_id
    FROM Lessons l
             JOIN Sections s ON l.section_id = s.section_id
    WHERE l.lesson_id = NEW.lesson_id;

    IF NOT EXISTS (
        SELECT 1 FROM Enrollments
        WHERE user_id = NEW.user_id AND course_id = v_course_id
    ) THEN
        RAISE EXCEPTION 'User % chưa enrolled vào course %', NEW.user_id, v_course_id;
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: check_review_enrollment(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_review_enrollment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM Enrollments
        WHERE user_id = NEW.user_id AND course_id = NEW.course_id
    ) THEN
        RAISE EXCEPTION 'User % chưa enrolled vào course % nên không thể review',
            NEW.user_id, NEW.course_id;
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: check_watched_seconds(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_watched_seconds() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_duration INTEGER;
BEGIN
    SELECT duration_seconds INTO v_duration
    FROM Lessons
    WHERE lesson_id = NEW.lesson_id;

    IF NEW.watched_seconds > v_duration THEN
        -- Tự clamp về duration thay vì raise exception
        -- Tránh lỗi do network lag hoặc player report thừa vài giây
        NEW.watched_seconds := v_duration;
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: refresh_course_rating_summary(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.refresh_course_rating_summary() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CourseRatingSummary;
    RETURN NULL;
END;
$$;


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: sync_enrollment_progress(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_enrollment_progress() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_course_id      BIGINT;
    v_total_lessons  INTEGER;
    v_done_lessons   INTEGER;
    v_new_percent    INTEGER;
BEGIN
    -- Xác định course từ lesson
    SELECT s.course_id INTO v_course_id
    FROM Lessons l
             JOIN Sections s ON l.section_id = s.section_id
    WHERE l.lesson_id = NEW.lesson_id;

    -- Tổng số lesson của course (không tính lesson đã xóa)
    SELECT COUNT(*) INTO v_total_lessons
    FROM Lessons l
             JOIN Sections s ON l.section_id = s.section_id
    WHERE s.course_id = v_course_id
      AND l.is_deleted = FALSE
      AND s.is_deleted = FALSE;

    -- Số lesson user đã hoàn thành
    SELECT COUNT(*) INTO v_done_lessons
    FROM LessonProgress lp
             JOIN Lessons l ON lp.lesson_id = l.lesson_id
             JOIN Sections s ON l.section_id = s.section_id
    WHERE lp.user_id = NEW.user_id
      AND s.course_id = v_course_id
      AND lp.is_completed = TRUE
      AND l.is_deleted = FALSE
      AND s.is_deleted = FALSE;

    -- Tính phần trăm, tránh chia 0
    IF v_total_lessons = 0 THEN
        v_new_percent := 0;
    ELSE
        v_new_percent := FLOOR(v_done_lessons * 100.0 / v_total_lessons);
    END IF;

    -- Cập nhật progress và completed_at nếu đạt 100%
    UPDATE Enrollments
    SET
        progress_percent = v_new_percent,
        completed_at = CASE
                           WHEN v_new_percent = 100 AND completed_at IS NULL THEN CURRENT_TIMESTAMP
                           WHEN v_new_percent < 100 THEN NULL
                           ELSE completed_at
            END
    WHERE user_id = NEW.user_id AND course_id = v_course_id;

    RETURN NEW;
END;
$$;


--
-- Name: sync_voucher_used_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_voucher_used_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.status = 'PAID'
        AND OLD.status != 'PAID'
        AND NEW.voucher_id IS NOT NULL
    THEN
        UPDATE Vouchers
        SET used_count = used_count + 1
        WHERE voucher_id = NEW.voucher_id;
    END IF;

    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: auditlogs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auditlogs (
    audit_log_id bigint NOT NULL,
    user_id bigint,
    action text NOT NULL,
    entity_name text NOT NULL,
    entity_id bigint NOT NULL,
    old_data jsonb,
    new_data jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: auditlogs_audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.auditlogs ALTER COLUMN audit_log_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.auditlogs_audit_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cart; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cart (
    user_id bigint NOT NULL,
    course_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    category_id bigint NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    parent_id bigint,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL
);


--
-- Name: categories_category_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.categories ALTER COLUMN category_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.categories_category_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: certificates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.certificates (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    course_id bigint NOT NULL,
    certificate_code text NOT NULL,
    file_key text NOT NULL,
    issued_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: certificates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.certificates_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: certificates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.certificates_id_seq OWNED BY public.certificates.id;


--
-- Name: course_announcements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course_announcements (
    id bigint NOT NULL,
    course_id bigint NOT NULL,
    teacher_id bigint NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    recipient_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: course_announcements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.course_announcements_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: course_announcements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.course_announcements_id_seq OWNED BY public.course_announcements.id;


--
-- Name: course_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course_categories (
    course_id bigint NOT NULL,
    category_id bigint NOT NULL,
    is_primary boolean DEFAULT false NOT NULL
);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    review_id bigint NOT NULL,
    course_id bigint NOT NULL,
    user_id bigint NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    instructor_reply text,
    replied_at timestamp with time zone,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: courseratingsummary; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.courseratingsummary AS
 SELECT course_id,
    count(*) AS review_count,
    round(avg(rating), 2) AS avg_rating,
    count(*) FILTER (WHERE (rating = 5)) AS star_5,
    count(*) FILTER (WHERE (rating = 4)) AS star_4,
    count(*) FILTER (WHERE (rating = 3)) AS star_3,
    count(*) FILTER (WHERE (rating = 2)) AS star_2,
    count(*) FILTER (WHERE (rating = 1)) AS star_1
   FROM public.reviews
  GROUP BY course_id
  WITH NO DATA;


--
-- Name: courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.courses (
    course_id bigint NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    description text NOT NULL,
    language character varying(10) DEFAULT 'vi'::character varying NOT NULL,
    requirements text[],
    what_you_learn text[],
    base_price numeric(10,2) NOT NULL,
    level public.course_level NOT NULL,
    status public.course_status DEFAULT 'DRAFT'::public.course_status NOT NULL,
    instructor_id bigint NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    published_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    thumbnail_key text,
    rejection_reason text,
    is_hidden boolean DEFAULT false NOT NULL,
    CONSTRAINT courses_base_price_check CHECK ((base_price >= (0)::numeric)),
    CONSTRAINT courses_check CHECK ((((status = 'PUBLISHED'::public.course_status) AND (published_at IS NOT NULL)) OR ((status <> 'PUBLISHED'::public.course_status) AND (published_at IS NULL))))
);


--
-- Name: courses_course_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.courses ALTER COLUMN course_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.courses_course_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: course_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course_tags (
    course_id bigint NOT NULL,
    tag_id bigint NOT NULL
);


--
-- Name: enrollments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enrollments (
    course_id bigint NOT NULL,
    user_id bigint NOT NULL,
    order_id bigint NOT NULL,
    enrolled_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    progress_percent integer DEFAULT 0 NOT NULL,
    completed_at timestamp with time zone,
    CONSTRAINT enrollments_check CHECK ((((completed_at IS NOT NULL) AND (progress_percent = 100)) OR ((completed_at IS NULL) AND (progress_percent < 100)))),
    CONSTRAINT enrollments_progress_percent_check CHECK (((progress_percent >= 0) AND (progress_percent <= 100)))
);


--
-- Name: instructor_follows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.instructor_follows (
    follower_id bigint NOT NULL,
    instructor_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: instructor_profile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.instructor_profile (
    instructor_id bigint NOT NULL,
    headline character varying(255),
    description text,
    expertise character varying(255),
    avatar_key text,
    social_links jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: lesson_summaries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lesson_summaries (
    summary_id bigint NOT NULL,
    lesson_id bigint NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: lesson_summaries_summary_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.lesson_summaries ALTER COLUMN summary_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.lesson_summaries_summary_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: lesson_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lesson_progress (
    user_id bigint NOT NULL,
    lesson_id bigint NOT NULL,
    is_completed boolean DEFAULT false NOT NULL,
    watched_seconds integer DEFAULT 0 NOT NULL,
    CONSTRAINT lesson_progress_watched_seconds_check CHECK ((watched_seconds >= 0))
);


--
-- Name: lesson_qa; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lesson_qa (
    qa_id bigint NOT NULL,
    lesson_id bigint NOT NULL,
    user_id bigint NOT NULL,
    parent_id bigint,
    content text NOT NULL,
    type character varying(10) DEFAULT 'QUESTION'::character varying,
    is_solved boolean DEFAULT false,
    is_pinned boolean DEFAULT false,
    like_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    reply_to_user_id bigint,
    root_id bigint,
    level integer DEFAULT 0
);


--
-- Name: lesson_qa_qa_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.lesson_qa ALTER COLUMN qa_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.lesson_qa_qa_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: lessons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lessons (
    lesson_id bigint NOT NULL,
    section_id bigint NOT NULL,
    title text NOT NULL,
    video_key text,
    lesson_order double precision NOT NULL,
    duration_seconds integer DEFAULT 0,
    view_count integer DEFAULT 0 NOT NULL,
    is_preview boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    video_original_filename text,
    video_content_type character varying(100),
    video_size_bytes bigint,
    hls_status text,
    media_convert_job_id text,
    hls_playlist_key text,
    CONSTRAINT lessons_view_count_check CHECK ((view_count >= 0))
);


--
-- Name: lessons_lesson_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.lessons ALTER COLUMN lesson_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.lessons_lesson_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: lesson_sources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lesson_sources (
    lesson_source_id bigint NOT NULL,
    lesson_id bigint NOT NULL,
    file_key text,
    resource_type public.lesson_source_type,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    original_file_name text,
    content_type character varying(100),
    file_size_bytes bigint,
    file_name text
);


--
-- Name: lesson_sources_lesson_source_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.lesson_sources ALTER COLUMN lesson_source_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.lesson_sources_lesson_source_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    notification_id bigint NOT NULL,
    user_id bigint NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    type text NOT NULL,
    link text,
    metadata jsonb
);


--
-- Name: notifications_notification_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.notifications ALTER COLUMN notification_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.notifications_notification_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    order_item_id bigint NOT NULL,
    order_id bigint NOT NULL,
    course_id bigint NOT NULL,
    original_price numeric(10,2) NOT NULL,
    price numeric(10,2) NOT NULL,
    CONSTRAINT order_items_original_price_check CHECK ((original_price >= (0)::numeric)),
    CONSTRAINT order_items_price_check CHECK ((price >= (0)::numeric))
);


--
-- Name: order_items_order_item_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.order_items ALTER COLUMN order_item_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.order_items_order_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    order_id bigint NOT NULL,
    user_id bigint NOT NULL,
    voucher_id bigint,
    subtotal numeric(10,2) NOT NULL,
    discount_amount numeric(10,2) DEFAULT 0 NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    status public.order_status DEFAULT 'PENDING'::public.order_status NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT orders_discount_amount_check CHECK ((discount_amount >= (0)::numeric)),
    CONSTRAINT orders_subtotal_check CHECK ((subtotal >= (0)::numeric)),
    CONSTRAINT orders_total_amount_check CHECK ((total_amount >= (0)::numeric))
);


--
-- Name: orders_order_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.orders ALTER COLUMN order_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.orders_order_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    payment_id bigint NOT NULL,
    order_id bigint NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'VND'::bpchar NOT NULL,
    payment_method public.payment_method NOT NULL,
    transaction_id text,
    status public.payment_status DEFAULT 'PENDING'::public.payment_status NOT NULL,
    paid_at timestamp with time zone,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT payments_amount_check CHECK ((amount >= (0)::numeric))
);


--
-- Name: payments_payment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.payments ALTER COLUMN payment_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.payments_payment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: payout_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payout_requests (
    id bigint NOT NULL,
    teacher_id bigint NOT NULL,
    amount numeric(12,2) NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    notes text,
    rejection_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    processed_at timestamp with time zone
);


--
-- Name: payout_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payout_requests_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payout_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payout_requests_id_seq OWNED BY public.payout_requests.id;


--
-- Name: promotion_courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promotion_courses (
    promotion_id bigint NOT NULL,
    course_id bigint NOT NULL
);


--
-- Name: promotions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promotions (
    promotion_id bigint NOT NULL,
    discount_percent integer NOT NULL,
    start_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    end_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by bigint,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT promotions_check CHECK ((end_date > start_date)),
    CONSTRAINT promotions_discount_percent_check CHECK (((discount_percent > 0) AND (discount_percent <= 100)))
);


--
-- Name: promotions_promotion_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.promotions ALTER COLUMN promotion_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.promotions_promotion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: quiz_answers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_answers (
    answer_id bigint NOT NULL,
    attempt_id bigint NOT NULL,
    question_id bigint NOT NULL,
    selected_option_id bigint,
    is_correct boolean NOT NULL
);


--
-- Name: quiz_answers_answer_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.quiz_answers ALTER COLUMN answer_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.quiz_answers_answer_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: quiz_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_attempts (
    attempt_id bigint NOT NULL,
    quiz_id bigint NOT NULL,
    user_id bigint NOT NULL,
    score integer NOT NULL,
    total_questions integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: quiz_attempts_attempt_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.quiz_attempts ALTER COLUMN attempt_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.quiz_attempts_attempt_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: quiz_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_options (
    option_id bigint NOT NULL,
    question_id bigint NOT NULL,
    option_text text NOT NULL,
    is_correct boolean DEFAULT false NOT NULL,
    order_index integer NOT NULL
);


--
-- Name: quiz_options_option_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.quiz_options ALTER COLUMN option_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.quiz_options_option_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: quiz_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_questions (
    question_id bigint NOT NULL,
    quiz_id bigint NOT NULL,
    question_text text NOT NULL,
    order_index integer NOT NULL
);


--
-- Name: quiz_questions_question_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.quiz_questions ALTER COLUMN question_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.quiz_questions_question_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: quizzes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quizzes (
    quiz_id bigint NOT NULL,
    lesson_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: quizzes_quiz_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.quizzes ALTER COLUMN quiz_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.quizzes_quiz_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: reviews_review_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.reviews ALTER COLUMN review_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.reviews_review_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    role_id bigint NOT NULL,
    role_name public.role_name NOT NULL
);


--
-- Name: roles_role_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.roles ALTER COLUMN role_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.roles_role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sections (
    section_id bigint NOT NULL,
    course_id bigint NOT NULL,
    title text NOT NULL,
    section_order double precision NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL
);


--
-- Name: sections_section_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.sections ALTER COLUMN section_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.sections_section_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tags (
    tag_id bigint NOT NULL,
    name character varying(50) NOT NULL,
    slug text NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: tags_tag_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.tags ALTER COLUMN tag_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.tags_tag_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: teacher_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teacher_applications (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    specialization character varying(255) NOT NULL,
    experience text NOT NULL,
    cv_key character varying(500) NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    rejection_reason text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    reviewed_at timestamp without time zone
);


--
-- Name: teacher_applications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.teacher_applications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: teacher_applications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.teacher_applications_id_seq OWNED BY public.teacher_applications.id;


--
-- Name: user_auth_providers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_auth_providers (
    provider_id bigint NOT NULL,
    user_id bigint NOT NULL,
    provider public.account_type NOT NULL,
    provider_user_id text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: user_auth_providers_provider_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.user_auth_providers ALTER COLUMN provider_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.user_auth_providers_provider_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: user_role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_role (
    user_id bigint NOT NULL,
    role_id bigint NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    user_id bigint NOT NULL,
    full_name character varying(100),
    email text NOT NULL,
    phone character varying(20),
    avatar text,
    cover_image text,
    date_of_birth date,
    gender public.gender_type,
    password_hash text,
    is_active boolean DEFAULT true,
    is_deleted boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    active_role character varying(50)
);


--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.users ALTER COLUMN user_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.users_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: verification_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verification_tokens (
    token_id bigint NOT NULL,
    user_id bigint NOT NULL,
    token text NOT NULL,
    token_type public.verification_type NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expired_at timestamp with time zone NOT NULL,
    is_used boolean DEFAULT false NOT NULL,
    CONSTRAINT verification_tokens_check CHECK ((expired_at > created_at))
);


--
-- Name: verification_tokens_token_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.verification_tokens ALTER COLUMN token_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.verification_tokens_token_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: vouchers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vouchers (
    voucher_id bigint NOT NULL,
    code text NOT NULL,
    description text NOT NULL,
    discount_type public.discount_type NOT NULL,
    discount_value numeric(10,2) NOT NULL,
    minimum_order numeric(10,2) NOT NULL,
    maximum_discount_amount numeric(10,2) NOT NULL,
    usage_limit integer NOT NULL,
    used_count integer DEFAULT 0 NOT NULL,
    start_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    end_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by bigint,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT vouchers_check CHECK ((((discount_type = 'Percent'::public.discount_type) AND (discount_value <= (100)::numeric)) OR (discount_type = 'Fixed'::public.discount_type))),
    CONSTRAINT vouchers_check1 CHECK ((used_count <= usage_limit)),
    CONSTRAINT vouchers_check2 CHECK ((end_date > start_date)),
    CONSTRAINT vouchers_discount_value_check CHECK ((discount_value > (0)::numeric)),
    CONSTRAINT vouchers_maximum_discount_amount_check CHECK ((maximum_discount_amount >= (0)::numeric)),
    CONSTRAINT vouchers_minimum_order_check CHECK ((minimum_order >= (0)::numeric)),
    CONSTRAINT vouchers_usage_limit_check CHECK ((usage_limit >= 0)),
    CONSTRAINT vouchers_used_count_check CHECK ((used_count >= 0))
);


--
-- Name: vouchers_voucher_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.vouchers ALTER COLUMN voucher_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.vouchers_voucher_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: wishlist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wishlist (
    user_id bigint NOT NULL,
    course_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: certificates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates ALTER COLUMN id SET DEFAULT nextval('public.certificates_id_seq'::regclass);


--
-- Name: course_announcements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_announcements ALTER COLUMN id SET DEFAULT nextval('public.course_announcements_id_seq'::regclass);


--
-- Name: payout_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payout_requests ALTER COLUMN id SET DEFAULT nextval('public.payout_requests_id_seq'::regclass);


--
-- Name: teacher_applications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_applications ALTER COLUMN id SET DEFAULT nextval('public.teacher_applications_id_seq'::regclass);


--
-- Name: auditlogs auditlogs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditlogs
    ADD CONSTRAINT auditlogs_pkey PRIMARY KEY (audit_log_id);


--
-- Name: cart cart_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_pkey PRIMARY KEY (user_id, course_id);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (category_id);


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- Name: certificates certificates_certificate_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_certificate_code_key UNIQUE (certificate_code);


--
-- Name: certificates certificates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_pkey PRIMARY KEY (id);


--
-- Name: certificates certificates_user_id_course_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_user_id_course_id_key UNIQUE (user_id, course_id);


--
-- Name: course_announcements course_announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_announcements
    ADD CONSTRAINT course_announcements_pkey PRIMARY KEY (id);


--
-- Name: course_categories course_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_categories
    ADD CONSTRAINT course_categories_pkey PRIMARY KEY (course_id, category_id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (course_id);


--
-- Name: courses courses_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_slug_key UNIQUE (slug);


--
-- Name: course_tags course_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_tags
    ADD CONSTRAINT course_tags_pkey PRIMARY KEY (course_id, tag_id);


--
-- Name: enrollments enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_pkey PRIMARY KEY (course_id, user_id);


--
-- Name: instructor_follows instructor_follows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructor_follows
    ADD CONSTRAINT instructor_follows_pkey PRIMARY KEY (follower_id, instructor_id);


--
-- Name: instructor_profile instructor_profile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructor_profile
    ADD CONSTRAINT instructor_profile_pkey PRIMARY KEY (instructor_id);


--
-- Name: lesson_summaries lesson_summaries_lesson_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_summaries
    ADD CONSTRAINT lesson_summaries_lesson_id_key UNIQUE (lesson_id);


--
-- Name: lesson_summaries lesson_summaries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_summaries
    ADD CONSTRAINT lesson_summaries_pkey PRIMARY KEY (summary_id);


--
-- Name: lesson_progress lesson_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_pkey PRIMARY KEY (user_id, lesson_id);


--
-- Name: lesson_qa lesson_qa_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_qa
    ADD CONSTRAINT lesson_qa_pkey PRIMARY KEY (qa_id);


--
-- Name: lessons lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_pkey PRIMARY KEY (lesson_id);


--
-- Name: lessons lessons_section_id_lesson_order_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_section_id_lesson_order_key UNIQUE (section_id, lesson_order);


--
-- Name: lesson_sources lesson_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_sources
    ADD CONSTRAINT lesson_sources_pkey PRIMARY KEY (lesson_source_id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (notification_id);


--
-- Name: order_items order_items_order_id_course_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_course_id_key UNIQUE (order_id, course_id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (order_item_id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (order_id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (payment_id);


--
-- Name: payments payments_transaction_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_transaction_id_key UNIQUE (transaction_id);


--
-- Name: payout_requests payout_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payout_requests
    ADD CONSTRAINT payout_requests_pkey PRIMARY KEY (id);


--
-- Name: promotion_courses promotion_courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotion_courses
    ADD CONSTRAINT promotion_courses_pkey PRIMARY KEY (promotion_id, course_id);


--
-- Name: promotions promotions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_pkey PRIMARY KEY (promotion_id);


--
-- Name: quiz_answers quiz_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_answers
    ADD CONSTRAINT quiz_answers_pkey PRIMARY KEY (answer_id);


--
-- Name: quiz_attempts quiz_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT quiz_attempts_pkey PRIMARY KEY (attempt_id);


--
-- Name: quiz_options quiz_options_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_options
    ADD CONSTRAINT quiz_options_pkey PRIMARY KEY (option_id);


--
-- Name: quiz_questions quiz_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT quiz_questions_pkey PRIMARY KEY (question_id);


--
-- Name: quizzes quizzes_lesson_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_lesson_id_key UNIQUE (lesson_id);


--
-- Name: quizzes quizzes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_pkey PRIMARY KEY (quiz_id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (review_id);


--
-- Name: reviews reviews_user_id_course_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_course_id_key UNIQUE (user_id, course_id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);


--
-- Name: roles roles_role_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_role_name_key UNIQUE (role_name);


--
-- Name: sections sections_course_id_section_order_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_course_id_section_order_key UNIQUE (course_id, section_order);


--
-- Name: sections sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_pkey PRIMARY KEY (section_id);


--
-- Name: tags tags_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_name_key UNIQUE (name);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (tag_id);


--
-- Name: tags tags_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_slug_key UNIQUE (slug);


--
-- Name: teacher_applications teacher_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_applications
    ADD CONSTRAINT teacher_applications_pkey PRIMARY KEY (id);


--
-- Name: user_auth_providers uk6aff95jlrrrwl9sd34oridmd; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_auth_providers
    ADD CONSTRAINT uk6aff95jlrrrwl9sd34oridmd UNIQUE (provider, provider_user_id);


--
-- Name: user_auth_providers ukd7jtydyg0hyillv8ur4pa12k9; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_auth_providers
    ADD CONSTRAINT ukd7jtydyg0hyillv8ur4pa12k9 UNIQUE (user_id, provider);


--
-- Name: reviews ukgvg1ect42p0nkk171cbuwho8o; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT ukgvg1ect42p0nkk171cbuwho8o UNIQUE (user_id, course_id);


--
-- Name: order_items ukm8ll9i069wu4wo73ampoohkkl; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT ukm8ll9i069wu4wo73ampoohkkl UNIQUE (order_id, course_id);


--
-- Name: user_auth_providers user_auth_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_auth_providers
    ADD CONSTRAINT user_auth_providers_pkey PRIMARY KEY (provider_id);


--
-- Name: user_auth_providers user_auth_providers_provider_provider_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_auth_providers
    ADD CONSTRAINT user_auth_providers_provider_provider_user_id_key UNIQUE (provider, provider_user_id);


--
-- Name: user_auth_providers user_auth_providers_user_id_provider_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_auth_providers
    ADD CONSTRAINT user_auth_providers_user_id_provider_key UNIQUE (user_id, provider);


--
-- Name: user_role user_role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_role
    ADD CONSTRAINT user_role_pkey PRIMARY KEY (user_id, role_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: verification_tokens verification_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_tokens
    ADD CONSTRAINT verification_tokens_pkey PRIMARY KEY (token_id);


--
-- Name: verification_tokens verification_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_tokens
    ADD CONSTRAINT verification_tokens_token_key UNIQUE (token);


--
-- Name: vouchers vouchers_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_code_key UNIQUE (code);


--
-- Name: vouchers vouchers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_pkey PRIMARY KEY (voucher_id);


--
-- Name: wishlist wishlist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlist
    ADD CONSTRAINT wishlist_pkey PRIMARY KEY (user_id, course_id);


--
-- Name: courseratingsummary_course_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX courseratingsummary_course_id_idx ON public.courseratingsummary USING btree (course_id);


--
-- Name: idx_audit_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_entity ON public.auditlogs USING btree (entity_name, entity_id);


--
-- Name: idx_audit_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_user ON public.auditlogs USING btree (user_id);


--
-- Name: idx_certificates_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_certificates_user ON public.certificates USING btree (user_id);


--
-- Name: idx_course_announcements_course; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_course_announcements_course ON public.course_announcements USING btree (course_id);


--
-- Name: idx_course_announcements_teacher; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_course_announcements_teacher ON public.course_announcements USING btree (teacher_id);


--
-- Name: idx_course_categories_cat; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_course_categories_cat ON public.course_categories USING btree (category_id);


--
-- Name: idx_course_categories_course; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_course_categories_course ON public.course_categories USING btree (course_id);


--
-- Name: idx_course_tags_course; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_course_tags_course ON public.course_tags USING btree (course_id);


--
-- Name: idx_course_tags_tag; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_course_tags_tag ON public.course_tags USING btree (tag_id);


--
-- Name: idx_courses_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_courses_active ON public.courses USING btree (course_id) WHERE (is_deleted = false);


--
-- Name: idx_courses_instructor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_courses_instructor ON public.courses USING btree (instructor_id);


--
-- Name: idx_courses_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_courses_level ON public.courses USING btree (level);


--
-- Name: idx_courses_price; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_courses_price ON public.courses USING btree (base_price);


--
-- Name: idx_courses_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_courses_slug ON public.courses USING btree (slug);


--
-- Name: idx_courses_title; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_courses_title ON public.courses USING btree (title);


--
-- Name: idx_email_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_token ON public.verification_tokens USING btree (token);


--
-- Name: idx_email_token_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_token_user ON public.verification_tokens USING btree (user_id) WHERE (is_used = false);


--
-- Name: idx_enrollment_course_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enrollment_course_id ON public.enrollments USING btree (course_id);


--
-- Name: idx_enrollment_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enrollment_user_id ON public.enrollments USING btree (user_id);


--
-- Name: idx_enrollments_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enrollments_order ON public.enrollments USING btree (order_id);


--
-- Name: idx_instructor_follows_instructor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_instructor_follows_instructor_id ON public.instructor_follows USING btree (instructor_id);


--
-- Name: idx_lesson_progress_lesson; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lesson_progress_lesson ON public.lesson_progress USING btree (lesson_id);


--
-- Name: idx_lesson_progress_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lesson_progress_user ON public.lesson_progress USING btree (user_id);


--
-- Name: idx_lessons_section; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lessons_section ON public.lessons USING btree (section_id);


--
-- Name: idx_notif_unread; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notif_unread ON public.notifications USING btree (user_id) WHERE (is_read = false);


--
-- Name: idx_notif_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notif_user_id ON public.notifications USING btree (user_id);


--
-- Name: idx_notifications_user_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_created ON public.notifications USING btree (user_id, created_at DESC);


--
-- Name: idx_notifications_user_unread; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_unread ON public.notifications USING btree (user_id) WHERE (is_read = false);


--
-- Name: idx_order_items_course; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_items_course ON public.order_items USING btree (course_id);


--
-- Name: idx_order_items_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_items_order ON public.order_items USING btree (order_id);


--
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- Name: idx_orders_status_pending; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_status_pending ON public.orders USING btree (status) WHERE (status = 'PENDING'::public.order_status);


--
-- Name: idx_orders_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_user ON public.orders USING btree (user_id);


--
-- Name: idx_payments_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_order ON public.payments USING btree (order_id);


--
-- Name: idx_payout_requests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payout_requests_status ON public.payout_requests USING btree (status);


--
-- Name: idx_payout_requests_teacher; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payout_requests_teacher ON public.payout_requests USING btree (teacher_id);


--
-- Name: idx_promotion_course_course; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_promotion_course_course ON public.promotion_courses USING btree (course_id);


--
-- Name: idx_promotions_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_promotions_dates ON public.promotions USING btree (start_date, end_date);


--
-- Name: idx_review_course; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_review_course ON public.reviews USING btree (course_id);


--
-- Name: idx_review_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_review_user ON public.reviews USING btree (user_id);


--
-- Name: idx_sections_course; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sections_course ON public.sections USING btree (course_id);


--
-- Name: idx_user_role_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_role_role ON public.user_role USING btree (role_id);


--
-- Name: idx_users_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_active ON public.users USING btree (user_id) WHERE ((is_deleted = false) AND (is_active = true));


--
-- Name: idx_vouchers_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vouchers_active ON public.vouchers USING btree (end_date) WHERE (is_active = true);


--
-- Name: idx_wishlist_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wishlist_user_id ON public.wishlist USING btree (user_id);


--
-- Name: uq_course_primary_category; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_course_primary_category ON public.course_categories USING btree (course_id) WHERE (is_primary = true);


--
-- Name: categories trg_categories_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: lesson_progress trg_check_lesson_progress_enrollment; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_check_lesson_progress_enrollment BEFORE INSERT ON public.lesson_progress FOR EACH ROW EXECUTE FUNCTION public.check_lesson_progress_enrollment();


--
-- Name: reviews trg_check_review_enrollment; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_check_review_enrollment BEFORE INSERT ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.check_review_enrollment();


--
-- Name: lesson_progress trg_check_watched_seconds; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_check_watched_seconds BEFORE INSERT OR UPDATE OF watched_seconds ON public.lesson_progress FOR EACH ROW EXECUTE FUNCTION public.check_watched_seconds();


--
-- Name: courses trg_courses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: lessons trg_lessons_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_lessons_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: orders trg_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: promotions trg_promotions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_promotions_updated_at BEFORE UPDATE ON public.promotions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: reviews trg_refresh_rating_summary; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_refresh_rating_summary AFTER INSERT OR DELETE OR UPDATE ON public.reviews FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_course_rating_summary();


--
-- Name: reviews trg_reviews_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: sections trg_sections_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_sections_updated_at BEFORE UPDATE ON public.sections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: lesson_progress trg_sync_enrollment_progress; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_sync_enrollment_progress AFTER INSERT OR UPDATE OF is_completed ON public.lesson_progress FOR EACH ROW EXECUTE FUNCTION public.sync_enrollment_progress();


--
-- Name: orders trg_sync_voucher_used_count; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_sync_voucher_used_count AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.sync_voucher_used_count();


--
-- Name: users trg_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: vouchers trg_vouchers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_vouchers_updated_at BEFORE UPDATE ON public.vouchers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: auditlogs auditlogs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditlogs
    ADD CONSTRAINT auditlogs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: cart cart_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id) ON DELETE CASCADE;


--
-- Name: cart cart_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(category_id) ON DELETE SET NULL;


--
-- Name: certificates certificates_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id) ON DELETE CASCADE;


--
-- Name: certificates certificates_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: course_announcements course_announcements_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_announcements
    ADD CONSTRAINT course_announcements_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id);


--
-- Name: course_announcements course_announcements_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_announcements
    ADD CONSTRAINT course_announcements_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(user_id);


--
-- Name: course_categories course_categories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_categories
    ADD CONSTRAINT course_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(category_id) ON DELETE CASCADE;


--
-- Name: course_categories course_categories_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_categories
    ADD CONSTRAINT course_categories_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id) ON DELETE CASCADE;


--
-- Name: courses courses_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.users(user_id);


--
-- Name: course_tags course_tags_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_tags
    ADD CONSTRAINT course_tags_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id) ON DELETE CASCADE;


--
-- Name: course_tags course_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_tags
    ADD CONSTRAINT course_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(tag_id) ON DELETE CASCADE;


--
-- Name: enrollments enrollments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id) ON DELETE CASCADE;


--
-- Name: enrollments enrollments_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON DELETE RESTRICT;


--
-- Name: enrollments enrollments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: instructor_profile fk_instructor_profile_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructor_profile
    ADD CONSTRAINT fk_instructor_profile_user FOREIGN KEY (instructor_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: lesson_summaries fk_lesson_summaries_lesson; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_summaries
    ADD CONSTRAINT fk_lesson_summaries_lesson FOREIGN KEY (lesson_id) REFERENCES public.lessons(lesson_id) ON DELETE CASCADE;


--
-- Name: lesson_qa fk_lesson_qa_lesson; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_qa
    ADD CONSTRAINT fk_lesson_qa_lesson FOREIGN KEY (lesson_id) REFERENCES public.lessons(lesson_id) ON DELETE CASCADE;


--
-- Name: lesson_qa fk_lesson_qa_parent; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_qa
    ADD CONSTRAINT fk_lesson_qa_parent FOREIGN KEY (parent_id) REFERENCES public.lesson_qa(qa_id) ON DELETE CASCADE;


--
-- Name: lesson_qa fk_lesson_qa_reply_to_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_qa
    ADD CONSTRAINT fk_lesson_qa_reply_to_user FOREIGN KEY (reply_to_user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: lesson_qa fk_lesson_qa_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_qa
    ADD CONSTRAINT fk_lesson_qa_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: quiz_answers fk_quiz_answers_attempt; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_answers
    ADD CONSTRAINT fk_quiz_answers_attempt FOREIGN KEY (attempt_id) REFERENCES public.quiz_attempts(attempt_id) ON DELETE CASCADE;


--
-- Name: quiz_answers fk_quiz_answers_option; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_answers
    ADD CONSTRAINT fk_quiz_answers_option FOREIGN KEY (selected_option_id) REFERENCES public.quiz_options(option_id) ON DELETE SET NULL;


--
-- Name: quiz_answers fk_quiz_answers_question; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_answers
    ADD CONSTRAINT fk_quiz_answers_question FOREIGN KEY (question_id) REFERENCES public.quiz_questions(question_id) ON DELETE CASCADE;


--
-- Name: quiz_attempts fk_quiz_attempts_quiz; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT fk_quiz_attempts_quiz FOREIGN KEY (quiz_id) REFERENCES public.quizzes(quiz_id) ON DELETE CASCADE;


--
-- Name: quiz_attempts fk_quiz_attempts_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT fk_quiz_attempts_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: quiz_options fk_quiz_options_question; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_options
    ADD CONSTRAINT fk_quiz_options_question FOREIGN KEY (question_id) REFERENCES public.quiz_questions(question_id) ON DELETE CASCADE;


--
-- Name: quiz_questions fk_quiz_questions_quiz; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT fk_quiz_questions_quiz FOREIGN KEY (quiz_id) REFERENCES public.quizzes(quiz_id) ON DELETE CASCADE;


--
-- Name: quizzes fk_quizzes_lesson; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT fk_quizzes_lesson FOREIGN KEY (lesson_id) REFERENCES public.lessons(lesson_id) ON DELETE CASCADE;


--
-- Name: instructor_follows instructor_follows_follower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructor_follows
    ADD CONSTRAINT instructor_follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: instructor_follows instructor_follows_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructor_follows
    ADD CONSTRAINT instructor_follows_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: lesson_progress lesson_progress_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(lesson_id) ON DELETE CASCADE;


--
-- Name: lesson_progress lesson_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: lessons lessons_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.sections(section_id) ON DELETE CASCADE;


--
-- Name: lesson_sources lesson_sources_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_sources
    ADD CONSTRAINT lesson_sources_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(lesson_id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: order_items order_items_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id);


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON DELETE CASCADE;


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: orders orders_voucher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_voucher_id_fkey FOREIGN KEY (voucher_id) REFERENCES public.vouchers(voucher_id) ON DELETE SET NULL;


--
-- Name: payments payments_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON DELETE CASCADE;


--
-- Name: payout_requests payout_requests_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payout_requests
    ADD CONSTRAINT payout_requests_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(user_id);


--
-- Name: promotion_courses promotion_courses_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotion_courses
    ADD CONSTRAINT promotion_courses_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id) ON DELETE CASCADE;


--
-- Name: promotion_courses promotion_courses_promotion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotion_courses
    ADD CONSTRAINT promotion_courses_promotion_id_fkey FOREIGN KEY (promotion_id) REFERENCES public.promotions(promotion_id) ON DELETE CASCADE;


--
-- Name: promotions promotions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: reviews reviews_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id) ON DELETE CASCADE;


--
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: sections sections_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id) ON DELETE CASCADE;


--
-- Name: teacher_applications teacher_applications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_applications
    ADD CONSTRAINT teacher_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: user_auth_providers user_auth_providers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_auth_providers
    ADD CONSTRAINT user_auth_providers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: user_role user_role_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_role
    ADD CONSTRAINT user_role_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id) ON DELETE CASCADE;


--
-- Name: user_role user_role_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_role
    ADD CONSTRAINT user_role_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: verification_tokens verification_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_tokens
    ADD CONSTRAINT verification_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: vouchers vouchers_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- Name: wishlist wishlist_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlist
    ADD CONSTRAINT wishlist_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id) ON DELETE CASCADE;


--
-- Name: wishlist wishlist_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlist
    ADD CONSTRAINT wishlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

