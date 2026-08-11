import axiosClient from "../../../../shared/api-client/AxiosClient";

const ADMIN_DASHBOARD_PATH = "/admin/dashboard";

export const getAdminDashboardApi = async (year, client = axiosClient) => {
  const response = await client.get(ADMIN_DASHBOARD_PATH, {
    params: year ? { year } : {},
  });
  return response.data;
};
