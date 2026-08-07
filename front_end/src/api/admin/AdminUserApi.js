import axiosClient from "../client/AxiosClient.js";

const ADMIN_USERS_PATH = "/admin/users";

export const getAdminUsersApi = async (client = axiosClient) => {
  const response = await client.get(ADMIN_USERS_PATH);
  return response.data;
};

export const createAdminUserApi = async (payload, client = axiosClient) => {
  const response = await client.post(`${ADMIN_USERS_PATH}/create`, payload);
  return response.data;
};

export const updateAdminUserApi = async (id, payload) => {
  const response = await axiosClient.put(`${ADMIN_USERS_PATH}/update/${id}`, payload);
  return response.data;
};

export const deleteAdminUserApi = async (id) => {
  const response = await axiosClient.delete(`${ADMIN_USERS_PATH}/delete/${id}`);
  return response.data;
};
