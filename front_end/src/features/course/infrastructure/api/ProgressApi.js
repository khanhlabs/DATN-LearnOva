import axiosClient from "../../../../shared/api-client/AxiosClient";

export const updateLessonProgressApi = async (lessonId, watchedSeconds) => {
    const response = await axiosClient.post("/progress/update", {
        lessonId,
        watchedSeconds,
    });
    return response.data;
};

export const getCourseProgressApi = async (courseId) => {
    const response = await axiosClient.get(`/progress/course/${courseId}`);
    return response.data;
};

export const restartCourseApi = async (courseId) => {
    const response = await axiosClient.post(`/progress/course/${courseId}/restart`);
    return response.data;
};
