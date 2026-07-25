import axiosClient from "./AxiosClient.js";

export const getFollowStatusApi = async (instructorId) => {
  const response = await axiosClient.get(`/instructors/${instructorId}/follow`);
  return response.data;
};

export const followInstructorApi = async (instructorId) => {
  const response = await axiosClient.post(`/instructors/${instructorId}/follow`);
  return response.data;
};

export const unfollowInstructorApi = async (instructorId) => {
  const response = await axiosClient.delete(`/instructors/${instructorId}/follow`);
  return response.data;
};
