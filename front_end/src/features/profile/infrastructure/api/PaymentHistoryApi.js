export const getPaymentHistoryApi = async (axiosPrivate, accessToken, params = {}) => {
  const response = await axiosPrivate.get("/payments/history", {
    params,
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
  return response.data;
};

export const getPaymentHistoryDetailApi = async (axiosPrivate, orderId, accessToken) => {
  const response = await axiosPrivate.get(`/payments/history/${orderId}`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
  return response.data;
};

export const downloadPaymentReceiptApi = async (axiosPrivate, orderId, accessToken) => {
  const response = await axiosPrivate.get(`/payments/history/${orderId}/invoice`, {
    responseType: "blob",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
  return response.data;
};
