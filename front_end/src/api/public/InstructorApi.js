import axiosClient from "../client/AxiosClient.js";

export const getPublicInstructorsApi = async () => {
  const response = await axiosClient.get("/instructors/public");
  return response.data;
};

export const getPublicInstructorByIdApi = async (instructorId) => {
  const response = await axiosClient.get(`/instructors/public/${instructorId}`);
  return response.data;
};
