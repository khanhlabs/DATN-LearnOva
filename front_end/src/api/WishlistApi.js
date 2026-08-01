import axiosClient from "./AxiosClient";

export const addWishlistApi = (courseId) =>
    axiosClient.post("/wishlist", {
        courseId,
    });

export const removeWishlistApi = (courseId) =>
    axiosClient.delete(`/wishlist/${courseId}`);

export const getWishlistApi = () =>
    axiosClient.get("/wishlist");

export const syncWishlistApi = (courseIds) =>
    axiosClient.post("/wishlist/sync", {
        courseIds,
    });