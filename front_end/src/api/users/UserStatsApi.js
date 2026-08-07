import axiosClient from "../client/AxiosClient";

export const getUserStatsApi = async () => {
    const response = await axiosClient.get("/user/stats");
    return response.data;
};
