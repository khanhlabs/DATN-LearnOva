import axiosClient from "../../../../../shared/api-client/AxiosClient";

export const getTeacherAnalytics = async () => {
  const response = await axiosClient.get("/teacher/analytics");
  return response.data;
};
