import axiosClient from "../../../../../shared/api-client/AxiosClient";

export const getTeacherTagsApi = async (client = axiosClient) => {
  const response = await client.get("/teacher/tags-management");
  return response.data;
};

export const getTeacherTagByIdApi = async (id, client = axiosClient) => {
  const response = await client.get(`/teacher/tags-management/${id}`);
  return response.data;
};

export const createTeacherTagApi = async (payload, client = axiosClient) => {
  const response = await client.post("/teacher/tags-management/create", payload);
  return response.data;
};

export const updateTeacherTagApi = async (id, payload, client = axiosClient) => {
  const response = await client.put(`/teacher/tags-management/update/${id}`, payload);
  return response.data;
};

export const deleteTeacherTagApi = async (id, client = axiosClient) => {
  const response = await client.delete(`/teacher/tags-management/delete/${id}`);
  return response.data;
};

export const getTeacherTagCoursesDropdownApi = async (client = axiosClient) => {
  const response = await client.get("/teacher/tags-management/courses-dropdown");
  return response.data;
};
