import api from "../client/AxiosClient.js";

export const getMyInstructorProfile = async () => {
    const response = await api.get("/teacher/profile");
    return response.data;
};

export const updateMyInstructorProfile = async (payload) => {
    const response = await api.put("/teacher/profile", payload);
    return response.data;
};
