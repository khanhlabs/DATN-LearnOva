import axiosClient from "./AxiosClient.js";

export const getCurrentUserApi = async () => {
    const response = await axiosClient.get("/user/me");
    return response.data;
};
export const getUserProfileApi = async () => {
    const response = await axiosClient.get("/user/profile");
    return response.data;
};
export const updateUserProfileApi = async (data) => {
    const response = await axiosClient.put("/user/profile", data);
    return response.data;
};
export const uploadAvatarApi = async (formData) => {
    const res = await axiosClient.post("/user/avatar", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return res.data;
};
export const changePasswordApi = async (data) => {
    const response = await axiosClient.put("/user/change-password", data);
    return response.data;
};
export const switchActiveRoleApi = async (role) => {
    const response = await axiosClient.patch("/user/active-role", { role });
    return response.data;
};