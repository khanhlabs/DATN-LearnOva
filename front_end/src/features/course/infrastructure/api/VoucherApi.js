import axiosClient from "../../../../shared/api-client/AxiosClient";

export const applyVoucherApi = async (request) => {
  const response = await axiosClient.post("/vouchers/apply", request);
  return response.data;
};

export const getAvailableVouchersApi = async (axiosPrivate, accessToken) => {
  const response = await axiosPrivate.get("/vouchers/available", {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
  return response.data;
};

export const claimVoucherApi = async (axiosPrivate, voucherId, accessToken) => {
  const response = await axiosPrivate.post(`/vouchers/${voucherId}/claim`, null, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
  return response.data;
};
