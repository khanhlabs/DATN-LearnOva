import axiosClient from "../../../../../shared/api-client/AxiosClient";

export const getTeacherDashboard = async () => {
  const response = await axiosClient.get("/teacher/dashboard");
  return response.data;
};
