import axiosClient from "../client/AxiosClient.js";

export const searchCourses = (query) =>
    axiosClient.get("/search", { params: { q: query } }).then((r) => r.data);
