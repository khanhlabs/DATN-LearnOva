import api from "../../../../../shared/api-client/AxiosClient";

export const getMyCourses = async () => {
    const response = await api.get("/teacher/courses");
    return response.data;
};

export const getActiveCategories = async () => {
    const response = await api.get("/courses/categories");
    return response.data;
};

export const createDraftCourse = async (payload) => {
    const response = await api.post(
        "/teacher/courses",
        payload
    );
    return response.data;
};

export const createSection = async (courseId, payload) => {
    const response = await api.post(
        `/teacher/courses/${courseId}/sections`,
        payload
    );
    return response.data;
};

export const updateSection = async (sectionId, payload) => {
    const response = await api.put(
        `/teacher/courses/sections/${sectionId}`,
        payload
    );
    return response.data;
};

export const createLesson = async (sectionId, payload) => {
    const response = await api.post(
        `/teacher/courses/sections/${sectionId}/lessons`,
        payload
    );
    return response.data;
};

export const updateLesson = async (lessonId, payload) => {
    const response = await api.put(
        `/teacher/courses/lessons/${lessonId}`,
        payload
    );
    return response.data;
};

export const updateLessonVideo = async (lessonId, payload) => {
    const response = await api.put(
        `/teacher/courses/lessons/${lessonId}/video`,
        payload
    );
    return response.data;
};

export const createLessonSource = async (lessonId, payload) => {
    const response = await api.post(
        `/teacher/courses/lessons/${lessonId}/sources`,
        payload
    );
    return response.data;
};

export const getLessonSources = async (lessonId) => {
    const response = await api.get(
        `/teacher/courses/lessons/${lessonId}/sources`
    );
    return response.data;
};

export const deleteLessonSource = async (sourceId) => {
    const response = await api.delete(
        `/teacher/courses/sources/${sourceId}`
    );
    return response.data;
};

export const updateCourseStatus = async (courseId, status) => {
    const response = await api.patch(`/teacher/courses/${courseId}/status`, { status });
    return response.data;
};

export const updateCourse = async (courseId, payload) => {
    const response = await api.put(`/teacher/courses/${courseId}`, payload);
    return response.data;
};

// Permanently removes the course from the teacher's list (soft delete on the backend).
export const softDeleteCourse = async (courseId) => {
    const response = await api.delete(`/teacher/courses/${courseId}`);
    return response.data;
};

// Toggles whether the course is hidden from students without deleting it.
export const toggleCourseVisibility = async (courseId) => {
    const response = await api.patch(`/teacher/courses/${courseId}/visibility`);
    return response.data;
};

export const getCourseForEdit = async (courseId) => {
    const response = await api.get(`/courses/${courseId}`);
    return response.data;
};

export const getFileUrl = async (fileKey) => {
    const response = await api.get("/courses/video-url", { params: { fileKey } });
    return response.data.url;
};

export const getCourseReviews = async (courseId) => {
    const response = await api.get(`/course/${courseId}`);
    return response.data;
};

export const getCourseRatingSummary = async (courseId) => {
    const response = await api.get(`/review/summary/${courseId}`);
    return response.data;
};
