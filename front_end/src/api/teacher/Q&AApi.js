import api from "../client/AxiosClient.js";

export const getMyQuestions = async () => {
    const response = await api.get("/qna/my-questions");
    return response.data;
};

export const setQuestionSolved = async (questionId, value) => {
    const response = await api.patch(`/qna/question/${questionId}/solved?value=${value}`);
    return response.data;
};

export const setQuestionPinned = async (questionId, value) => {
    const response = await api.patch(`/qna/question/${questionId}/pinned?value=${value}`);
    return response.data;
};

export const answerQuestion = async (questionId, content) => {
    const response = await api.post("/qna/answer", { parentId: questionId, content });
    return response.data;
};
