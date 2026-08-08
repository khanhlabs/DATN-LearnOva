import api from "../client/AxiosClient.js";

export const getMyPromotions = async () => {
    const response = await api.get("/teacher/promotions/my-courses");
    return response.data;
};

export const createPromotion = async (payload) => {
    const response = await api.post("/teacher/promotions", payload);
    return response.data;
};

export const updatePromotion = async (promotionId, payload) => {
    const response = await api.put(`/teacher/promotions/${promotionId}`, payload);
    return response.data;
};

export const deletePromotion = async (promotionId) => {
    await api.delete(`/teacher/promotions/${promotionId}`);
};
