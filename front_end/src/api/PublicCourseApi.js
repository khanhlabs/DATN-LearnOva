import axiosClient from "./AxiosClient.js";

export const getFeaturedCourses = () =>
    axiosClient.get("/courses/featured").then((r) => r.data);

export const getTopCategories = () =>
    axiosClient.get("/courses/top-categories").then((r) => r.data);

export const getPlatformStats = () =>
    axiosClient.get("/courses/stats").then((r) => r.data);

export const getCourseDetail = (courseId) =>
    axiosClient.get(`/courses/${courseId}`).then((r) => r.data);

export const getFileUrl = (fileKey) =>
    axiosClient.get("/courses/video-url", { params: { fileKey } }).then((r) => r.data.url);


