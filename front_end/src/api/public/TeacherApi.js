import axiosClient from "../client/AxiosClient.js";

export const getInstructors = () =>
    axiosClient.get("/instructors").then((r) => r.data);

export const getInstructorProfile = (instructorId) =>
    axiosClient.get(`/instructors/${instructorId}`).then((r) => r.data);
