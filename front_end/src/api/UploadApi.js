import axiosClient from "./AxiosClient.js";

export const generateUploadUrl = async ({ type, fileName, contentType }) => {
    const response = await axiosClient.post("/uploads/presigned-url", {
        type,
        fileName,
        contentType,
    });

    return response.data;
};
