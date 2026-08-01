import axiosClient from "../AxiosClient.js";

export const getAdminVouchersApi = async (client = axiosClient) => {
  const response = await client.get("/admin/vouchers");
  return response.data;
};

export const getAdminVoucherUsageHistoriesApi = async (client = axiosClient) => {
  const response = await client.get("/admin/vouchers/usage-history");
  return response.data;
};

export const getAdminVoucherUsageFrequencyApi = async (client = axiosClient) => {
  const response = await client.get("/admin/vouchers/usage-frequency");
  return response.data;
};

export const getAdminVoucherCampaignStatsApi = async (client = axiosClient) => {
  const response = await client.get("/admin/vouchers/campaign-stats");
  return response.data;
};

export const createAdminVoucherApi = async (payload, client = axiosClient) => {
  const response = await client.post("/admin/vouchers/create", payload);
  return response.data;
};

export const updateAdminVoucherApi = async (id, payload, client = axiosClient) => {
  const response = await client.put(`/admin/vouchers/update/${id}`, payload);
  return response.data;
};

export const deleteAdminVoucherApi = async (id, client = axiosClient) => {
  const response = await client.delete(`/admin/vouchers/delete/${id}`);
  return response.data;
};
