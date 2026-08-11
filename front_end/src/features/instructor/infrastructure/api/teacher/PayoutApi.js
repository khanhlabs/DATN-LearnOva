import api from "../../../../../shared/api-client/AxiosClient";

export const getPayoutBalance = async () => {
    const response = await api.get("/teacher/payout-requests/balance");
    return response.data;
};

export const getMyPayoutHistory = async () => {
    const response = await api.get("/teacher/payout-requests");
    return response.data;
};

export const requestPayout = async (payload) => {
    const response = await api.post("/teacher/payout-requests", payload);
    return response.data;
};
