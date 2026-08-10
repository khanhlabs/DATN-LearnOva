import api from "../../../../../shared/api-client/AxiosClient";

export const getMyAnnouncements = async (page = 0, size = 10) => {
    const response = await api.get("/teacher/announcements", { params: { page, size } });
    return response.data;
};

export const createAnnouncement = async (payload) => {
    const response = await api.post("/teacher/announcements", payload);
    return response.data;
};
