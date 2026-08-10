import axiosClient from "../../../../shared/api-client/AxiosClient";

export const applyVoucherApi = async ({ code, subtotal }) => {
  const response = await axiosClient.post("/vouchers/apply", {
    code,
    subtotal,
  });

  return response.data;
};
