export const COURSE_TITLE_MAX_LENGTH = 120;
export const COURSE_DESCRIPTION_MAX_LENGTH = 2000;

export const THUMBNAIL_ACCEPTED_TYPES = "image/jpeg,image/png,image/webp";
export const MAX_THUMBNAIL_SIZE = 5 * 1024 * 1024;         // 5 MB
export const MAX_VIDEO_SIZE    = 2 * 1024 * 1024 * 1024;   // 2 GB
export const MAX_DOCUMENT_SIZE = 50 * 1024 * 1024;         // 50 MB

const THUMBNAIL_MIME = ["image/jpeg", "image/png", "image/webp"];

export const validateThumbnail = (file) => {
    if (!THUMBNAIL_MIME.includes(file.type)) return "Only JPG, PNG, or WebP images are allowed.";
    if (file.size > MAX_THUMBNAIL_SIZE) return "Image must be 5 MB or smaller.";
    return null;
};

export const validateVideo = (file) => {
    if (!file.type.startsWith("video/")) return "Only video files are allowed.";
    if (file.size > MAX_VIDEO_SIZE) return "Video must be 2 GB or smaller.";
    return null;
};

export const validateDocument = (file) => {
    if (file.size > MAX_DOCUMENT_SIZE) return "File must be 50 MB or smaller.";
    return null;
};

// kept for backward compat
export const isValidUploadFile = (file) => Boolean(file);

export const validateCourseInfo = (course) => {
    const errors = {};

    if (!course.title?.trim()) {
        errors.title = "Course title is required.";
    } else if (course.title.length > COURSE_TITLE_MAX_LENGTH) {
        errors.title = `Title must be ${COURSE_TITLE_MAX_LENGTH} characters or fewer.`;
    }

    if (!course.description?.trim()) {
        errors.description = "Description is required.";
    }

    if (course.basePrice === "" || course.basePrice === null || course.basePrice === undefined) {
        errors.basePrice = "Price is required.";
    } else if (Number(course.basePrice) < 0) {
        errors.basePrice = "Price must be 0 or greater.";
    }

    return errors;
};

export const getCourseCreationIssues = (course, sections) => {
    const issues = [];

    if (!course.title?.trim()) issues.push("Course title is required.");
    if (!course.description?.trim()) issues.push("Course description is required.");
    if (course.description?.length > COURSE_DESCRIPTION_MAX_LENGTH) {
        issues.push(`Course description must be ${COURSE_DESCRIPTION_MAX_LENGTH} characters or fewer.`);
    }

    sections.forEach((section, si) => {
        if (!section.title?.trim()) issues.push(`Section ${si + 1} needs a title.`);
        section.lessons.forEach((lesson, li) => {
            if (!lesson.title?.trim()) issues.push(`Lesson ${li + 1} in section ${si + 1} needs a title.`);
        });
    });

    return issues;
};
