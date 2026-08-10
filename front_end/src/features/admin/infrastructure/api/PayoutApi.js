import axiosClient from "../../../../shared/api-client/AxiosClient";

export const getAdminPayoutRequestsApi = async (client = axiosClient) => {
  const response = await client.get("/admin/payout-requests");
  return response.data;
};

export const getAdminPayoutRequestDetailApi = async (id, client = axiosClient) => {
  const response = await client.get(`/admin/payout-requests/${id}`);
  return response.data;
};

export const markPayoutPaidApi = async (id, client = axiosClient) => {
  const response = await client.patch(`/admin/payout-requests/${id}/mark-paid`);
  return response.data;
};

export const rejectPayoutRequestApi = async (id, reason, client = axiosClient) => {
  const response = await client.patch(`/admin/payout-requests/${id}/reject`, { reason });
  return response.data;
};
