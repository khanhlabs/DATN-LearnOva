import axiosClient from "../../../../shared/api-client/AxiosClient";

export const getAiGenerationStatusApi = async (lessonId) => {
    const res = await axiosClient.get(
        `/lessons/${lessonId}/ai-generation-status`,
    );
    return res.data;
};
