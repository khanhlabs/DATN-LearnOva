import api from "../../../../../shared/api-client/AxiosClient";

export const getMyReviews = async () => {
    const response = await api.get("/teacher/reviews");
    return response.data;
};

export const replyToReview = async (reviewId, reply) => {
    const response = await api.patch(`/teacher/reviews/${reviewId}/reply`, { reply });
    return response.data;
};
