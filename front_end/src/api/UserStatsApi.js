import axiosClient from "./AxiosClient.js";

export const getUserStatsApi = async () => {
    const response = await axiosClient.get("/user/stats");
    return response.data;
};
