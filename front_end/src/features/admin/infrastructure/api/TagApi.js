import axiosClient from "../../../../shared/api-client/AxiosClient";

export const getAdminTagsApi = async (client = axiosClient) => {
  const response = await client.get("/admin/tags-management");
  return response.data;
};

export const getAdminTagByIdApi = async (id, client = axiosClient) => {
  const response = await client.get(`/admin/tags-management/${id}`);
  return response.data;
};

export const createAdminTagApi = async (payload, client = axiosClient) => {
  const response = await client.post("/admin/tags-management/create", payload);
  return response.data;
};

export const updateAdminTagApi = async (id, payload, client = axiosClient) => {
  const response = await client.put(`/admin/tags-management/update/${id}`, payload);
  return response.data;
};

export const deleteAdminTagApi = async (id, client = axiosClient) => {
  const response = await client.delete(`/admin/tags-management/delete/${id}`);
  return response.data;
};

export const getAdminTagCoursesDropdownApi = async (client = axiosClient) => {
  const response = await client.get("/admin/tags-management/courses-dropdown");
  return response.data;
};
