import axiosClient from "../client/AxiosClient.js";

export const getAdminCategoriesApi = async (client = axiosClient) => {
  const response = await client.get("/admin/categories-management");
  return response.data;
};

export const getAdminCategoryByIdApi = async (id, client = axiosClient) => {
  const response = await client.get(`/admin/categories-management/${id}`);
  return response.data;
};

export const createAdminCategoryApi = async (payload, client = axiosClient) => {
  const response = await client.post("/admin/categories-management/create", payload);
  return response.data;
};

export const updateAdminCategoryApi = async (id, payload, client = axiosClient) => {
  const response = await client.put(`/admin/categories-management/update/${id}`, payload);
  return response.data;
};

export const deleteAdminCategoryApi = async (id, client = axiosClient) => {
  const response = await client.delete(`/admin/categories-management/delete/${id}`);
  return response.data;
};