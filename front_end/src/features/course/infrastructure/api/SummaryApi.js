import axiosClient from "../../../../shared/api-client/AxiosClient";

export const getLessonSummaryApi = async (lessonId) => {
    const res = await axiosClient.get(`/lessons/${lessonId}/summary`);
    return res.data;
};

export const generateLessonSummaryApi = async (lessonId) => {
    const res = await axiosClient.post(`/lessons/${lessonId}/summary`);
    return res.data;
};
