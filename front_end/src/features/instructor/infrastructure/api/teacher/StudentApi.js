import api from "../../../../../shared/api-client/AxiosClient";

export const getMyStudents = async () => {
    const response = await api.get("/teacher/students");
    return response.data;
};
