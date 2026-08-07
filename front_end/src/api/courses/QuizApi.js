import axiosClient from "../client/AxiosClient.js";

export const getQuizApi = async (lessonId) => {
    const res = await axiosClient.get(`/lessons/${lessonId}/quiz`);
    return res.data;
};

export const generateQuizApi = async (lessonId) => {
    const res = await axiosClient.post(`/lessons/${lessonId}/quiz`);
    return res.data;
};

export const submitQuizApi = async (lessonId, answers) => {
    const res = await axiosClient.post(`/lessons/${lessonId}/quiz/submit`, { answers });
    return res.data;
};
