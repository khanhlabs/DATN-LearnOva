import axiosClient from "../client/AxiosClient.js";

export const submitTeacherApplicationApi = async (data) => {
  const response = await axiosClient.post("/teacher/applications", data);
  return response.data;
};

export const getMyTeacherApplicationsApi = async () => {
  const response = await axiosClient.get("/teacher/applications/me");
  return response.data;
};

export const getMyCvUrlApi = async (id) => {
  const response = await axiosClient.get(`/teacher/applications/${id}/cv-url`);
  return response.data;
};
