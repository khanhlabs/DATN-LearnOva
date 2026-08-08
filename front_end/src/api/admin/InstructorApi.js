import axiosClient from "../client/AxiosClient.js";

export const getAdminInstructorsApi = async (client = axiosClient) => {
  const response = await client.get("/admin/instructors-management");
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (data == null) return [];
  return [data];
};

export const getAdminInstructorByIdApi = async (id, client = axiosClient) => {
  const response = await client.get(`/admin/instructors-management/${id}`);
  return response.data;
};
