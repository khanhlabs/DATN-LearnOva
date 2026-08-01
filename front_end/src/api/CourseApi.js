import axiosClient from "./AxiosClient.js";

export const getPublicCoursesApi = async () => {
  const response = await axiosClient.get("/courses/public");
  return response.data;
};

export const getPublicCourseByIdApi = async (courseId) => {
  const response = await axiosClient.get(`/courses/public/${courseId}`);
  return response.data;
};

export const getCourseDetailApi = async (courseId) => {
  const response = await axiosClient.get(`/courses/${courseId}`);
  return response.data;
};
