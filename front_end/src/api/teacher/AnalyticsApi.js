import axiosClient from "../client/AxiosClient.js";

export const getTeacherAnalytics = async () => {
  const response = await axiosClient.get("/teacher/analytics");
  return response.data;
};
