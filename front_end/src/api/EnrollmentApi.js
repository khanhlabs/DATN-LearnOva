import axiosClient from "./AxiosClient.js";

export const checkEnrollment = (courseId) =>
    axiosClient.get("/enrollments/check", { params: { courseId } }).then((r) => r.data.enrolled);
export const getMyEnrolledCoursesApi = async (axiosPrivate, accessToken) => {
  const response = await axiosPrivate.get("/enrollments/my-courses", {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
  return response.data;
};
export const getContinueLearningApi = async (axiosPrivate, accessToken) => {
  const response = await axiosPrivate.get("/enrollments/continue-learning", {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    validateStatus: (status) => status === 200 || status === 204,
  });
  return response.status === 204 ? null : response.data;
};
export const getCourseCurriculumApi = async (axiosPrivate, courseId, accessToken) => {
  const response = await axiosPrivate.get(`/student/courses/${courseId}/curriculum`,
      {
        headers: accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : undefined,
      }
  );


  return response.data;
};
export const getCourseReviewsApi = async (
    axiosPrivate,
    courseId,
    accessToken
) => {
    const response = await axiosPrivate.get(
        `/student/courses/${courseId}/reviews`,
        {
            headers: accessToken
                ? { Authorization: `Bearer ${accessToken}` }
                : undefined,
        }
    );

    return response.data;
};