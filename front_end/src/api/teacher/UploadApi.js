import apiClient from "../client/AxiosClient.js";

export const generateUploadUrl = async ({type, fileName, contentType}) => {
    const response = await apiClient.post("/uploads/presigned-url",
        {
            type,
            fileName,
            contentType,
        }
    );

    return response.data;
};