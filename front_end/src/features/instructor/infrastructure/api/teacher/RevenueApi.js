import axiosClient from "../../../../../shared/api-client/AxiosClient";

export const getTeacherRevenue = async () => {
  const response = await axiosClient.get("/teacher/revenue");
  return response.data;
};
