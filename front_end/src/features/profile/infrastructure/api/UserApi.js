import axiosClient from "../../../../shared/api-client/AxiosClient";

export const getCurrentUserApi = async () => {
    const response = await axiosClient.get("/user/me");
    return response.data;
};
export const getUserProfileApi = async (accessToken) => {
    const response = await axiosClient.get("/user/profile", {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    });
    return response.data;
};
export const updateUserProfileApi = async (data, accessToken) => {
    const response = await axiosClient.put("/user/profile", data, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    });
    return response.data;
};
export const uploadAvatarApi = async (avatarKey, accessToken) => {
    const res = await axiosClient.post("/user/avatar", { avatarKey }, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
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