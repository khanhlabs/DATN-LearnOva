import axiosClient from "../client/AxiosClient.js";

export const getTeacherRevenue = async () => {
  const response = await axiosClient.get("/teacher/revenue");
  return response.data;
};
