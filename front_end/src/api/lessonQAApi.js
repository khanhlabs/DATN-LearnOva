import axiosClient from "./AxiosClient";

export const getLessonQAApi = async (lessonId) => {
    const res = await axiosClient.get(`/qna/lesson/${lessonId}`);
    return res.data;
};
export const createQuestionApi = async (data) => {
    const res = await axiosClient.post("/qna/question", data);
    return res.data;
};
export const createAnswerApi = async (data) => {
    const res = await axiosClient.post("/qna/answer", data);
    return res.data;
};
export const deleteAnswerApi = async (answerId) => {
    const res = await axiosClient.delete(`/qna/answer/${answerId}`);
    return res.data;
};
export const deleteQuestionApi = async (id) => {
    const res = await axiosClient.delete(`/qna/question/${id}`);
    return res.data;
};
export const updateAnswerApi = async (id, data) => {
    const res = await axiosClient.put(`/qna/answer/${id}`, data);
    return res.data;
};

export const updateQuestionApi = async (id, data) => {
    const res = await axiosClient.put(`/qna/question/${id}`, data);
    return res.data;
};

export const setQuestionSolvedApi = async (id, value) => {
    const res = await axiosClient.patch(`/qna/question/${id}/solved?value=${value}`);
    return res.data;
};

export const setQuestionPinnedApi = async (id, value) => {
    const res = await axiosClient.patch(`/qna/question/${id}/pinned?value=${value}`);
    return res.data;
};

export const toggleQALikeApi = async (qaId) => {
    const res = await axiosClient.patch(`/qna/${qaId}/like`);
    return res.data;
};
