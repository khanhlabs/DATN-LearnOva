import axiosClient from "../client/AxiosClient.js";

export const getTeacherDashboard = async () => {
  const response = await axiosClient.get("/teacher/dashboard");
  return response.data;
};
