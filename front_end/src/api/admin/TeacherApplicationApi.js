import axiosClient from "../client/AxiosClient.js";

export const getAdminTeacherApplicationsApi = async (client = axiosClient) => {
  const response = await client.get("/admin/teacher-applications");
  return response.data;
};

export const getAdminTeacherApplicationDetailApi = async (id, client = axiosClient) => {
  const response = await client.get(`/admin/teacher-applications/${id}`);
  return response.data;
};

export const getCvUrlApi = async (id, client = axiosClient) => {
  const response = await client.get(`/admin/teacher-applications/${id}/cv-url`);
  return response.data;
};

export const approveTeacherApplicationApi = async (id, client = axiosClient) => {
  const response = await client.patch(`/admin/teacher-applications/${id}/approve`);
  return response.data;
};

export const rejectTeacherApplicationApi = async (id, reason, client = axiosClient) => {
  const response = await client.patch(`/admin/teacher-applications/${id}/reject`, { reason });
  return response.data;
};
