import axiosClient from "./AxiosClient.js";


export const loginApi = async (email, password, rememberMe) => {
    const response = await axiosClient.post("/auth/login", {
        email,
        password,
        rememberMe
    });

    return response.data;
};

export const refreshApi = async () => {
    const response = await axiosClient.post("/auth/refresh");
    return response.data;
};

export const logoutApi = async () => {
    await axiosClient.post("/auth/logout");
};
export const registerApi = async (data) => {
    const response = await axiosClient.post("/auth/register", data);
    return response.data;
};
export const resendVerifyEmailApi = async (email) => {
    const res = await axiosClient.post("/auth/resend-verification", {
        email
    });
    return res.data;
};

export const forgotPasswordApi = async (email) => {
    const res = await axiosClient.post("/auth/forgot-password", { email });
    return res.data;
};

export const validateResetTokenApi = async (token) => {
    const res = await axiosClient.get("/auth/validate-reset-token", {
        params: { token },
    });
    return res.data;
};

export const resetPasswordApi = async (token, newPassword) => {
    const res = await axiosClient.post("/auth/reset-password", {
        token,
        newPassword,
    });
    return res.data;
};

export const verifyAccountApi = async (token) => {
    const res = await axiosClient.get("/auth/verify", {
        params: { token },
    });
    return res.data;
};


