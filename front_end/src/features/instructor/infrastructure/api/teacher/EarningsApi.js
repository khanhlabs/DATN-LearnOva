import axiosClient from "../../../../../shared/api-client/AxiosClient";

export const getTeacherEarnings = async () => {
  const response = await axiosClient.get("/teacher/earnings");
  return response.data;
};

export const getTeacherEarningDetail = async (orderItemId) => {
  const response = await axiosClient.get(`/teacher/earnings/${orderItemId}`);
  return response.data;
};
