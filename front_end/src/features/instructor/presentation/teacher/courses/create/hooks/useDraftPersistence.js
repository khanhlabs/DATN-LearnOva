import {useEffect} from "react";

const DRAFT_KEY = "learnova_course_draft";

// Omit thumbnailPreviewUrl — it's a blob URL that dies across sessions.
const OMIT_KEYS = new Set(["thumbnailPreviewUrl"]);

const sanitizeCourse = (course) => {
    const out = {};
    for (const [k, v] of Object.entries(course)) {
        if (!OMIT_KEYS.has(k)) out[k] = v;
    }
    return out;
};

export const saveDraft = (course, sections, currentStep) => {
    try {
        sessionStorage.setItem(
            DRAFT_KEY,
            JSON.stringify({course: sanitizeCourse(course), sections, currentStep})
        );
    } catch {
        // storage quota — silently ignore
    }
};

export const loadDraft = () => {
    try {
        const raw = sessionStorage.getItem(DRAFT_KEY);
        if (!raw) return null;
        const draft = JSON.parse(raw);
        // Drafts for courses already saved to the cloud are stale — the cloud
        // is the source of truth once course.id exists. Auto-clear them so
        // "Create new course" always starts fresh.
        if (draft?.course?.id) {
            sessionStorage.removeItem(DRAFT_KEY);
            return null;
        }
        return draft;
    } catch {
        return null;
    }
};

export const clearDraft = () => {
    try {
        sessionStorage.removeItem(DRAFT_KEY);
    } catch {}
};

// Hook: auto-save whenever course/sections/step change.
// Only persists pre-save state (course.id === null). Once the course exists in
// the cloud, the server is the source of truth — no local draft needed.
export const useDraftPersistence = (course, sections, currentStep) => {
    useEffect(() => {
        if (!course || course.id) return;
        saveDraft(course, sections, currentStep);
    }, [course, sections, currentStep]);
};
