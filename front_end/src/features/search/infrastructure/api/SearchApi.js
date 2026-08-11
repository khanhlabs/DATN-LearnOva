import axiosClient from "../../../../shared/api-client/AxiosClient.js";

export const searchCourses = (query) =>
    axiosClient.get("/search", { params: { q: query } }).then((r) => r.data);
