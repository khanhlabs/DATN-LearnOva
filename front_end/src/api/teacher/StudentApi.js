import api from "../client/AxiosClient.js";

export const getMyStudents = async () => {
    const response = await api.get("/teacher/students");
    return response.data;
};
