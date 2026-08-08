import axiosClient from "../client/AxiosClient.js";

export const getAdminCoursesApi = async (client = axiosClient) => {
  const response = await client.get("/admin/courses-management");
  return response.data;
};

/** Full detail with sections/lessons for view popups and approval pages. */
export const getAdminCourseDetailApi = async (id, client = axiosClient) => {
  const response = await client.get(`/admin/courses-management/${id}/detail`);
  return response.data;
};

/** Approve a DRAFT course and publish it. */
export const approveAdminCourseApi = async (id, client = axiosClient) => {
  const response = await client.patch(`/admin/courses-management/${id}/approve`);
  return response.data;
};

/** Hide a PENDING_REVIEW course by archiving it. */
export const hideAdminCourseApi = async (id, client = axiosClient) => {
  const response = await client.patch(`/admin/courses-management/${id}/hide`);
  return response.data;
};

/** Reject a PENDING_REVIEW course with a reason. */
export const rejectAdminCourseApi = async (id, reason, client = axiosClient) => {
  const response = await client.patch(`/admin/courses-management/${id}/reject`, { reason });
  return response.data;
};

