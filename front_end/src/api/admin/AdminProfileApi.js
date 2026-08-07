import axiosClient from "../client/AxiosClient.js";

export const getAdminProfileApi = async () => {
  const response = await axiosClient.get("/user/profile");
  return response.data;
};

export const updateAdminProfileApi = async (data) => {
  const response = await axiosClient.put("/user/profile", data);
  return response.data;
};

export const uploadAdminAvatarApi = async (avatarKey) => {
  const response = await axiosClient.post("/user/avatar", { avatarKey });
  return response.data;
};

export const getAdminPresignedUploadUrl = async ({ type, fileName, contentType }) => {
  const response = await axiosClient.post("/uploads/presigned-url", {
    type,
    fileName,
    contentType,
  });
  return response.data;
};
