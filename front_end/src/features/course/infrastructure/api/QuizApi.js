import axiosClient from "../../../../shared/api-client/AxiosClient";

export const getQuizApi = async (lessonId) => {
    const res = await axiosClient.get(`/lessons/${lessonId}/quiz`);
    return res.data;
};

export const submitQuizApi = async (lessonId, answers) => {
    const res = await axiosClient.post(`/lessons/${lessonId}/quiz/submit`, { answers });
    return res.data;
};
