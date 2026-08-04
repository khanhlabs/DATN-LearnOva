import axiosClient from "../AxiosClient.js";

export const getAdminTopRevenueCoursesApi = async (
  { page = 0, size = 5 } = {},
  client = axiosClient
) => {
  const response = await client.get("/admin/revenue/top-courses", {
    params: { page, size },
  });
  return response.data;
};

export const getAdminTopEarningInstructorsApi = async (
  { page = 0, size = 5 } = {},
  client = axiosClient
) => {
  const response = await client.get("/admin/revenue/top-instructors", {
    params: { page, size },
  });
  return response.data;
};

export const getAdminRevenueOverviewApi = async (client = axiosClient) => {
  const response = await client.get("/admin/revenue/overview");
  return response.data;
};

export const getAdminRevenueComparisonApi = async (
  { range = "month" } = {},
  client = axiosClient
) => {
  const response = await client.get("/admin/revenue/comparison", {
    params: { range },
  });
  return response.data;
};

export const getAdminRevenueTransactionsApi = async (
  {
    page = 0,
    size = 7,
    search = "",
    categoryId,
    paymentMethod,
    status,
  } = {},
  client = axiosClient
) => {
  const response = await client.get("/admin/revenue/transactions", {
    params: {
      page,
      size,
      search: search || undefined,
      categoryId: categoryId || undefined,
      paymentMethod: paymentMethod || undefined,
      status: status || undefined,
    },
  });
  return response.data;
};

export const getAdminRevenueTransactionInsightsApi = async (
  client = axiosClient
) => {
  const response = await client.get("/admin/revenue/transaction-insights");
  return response.data;
};
