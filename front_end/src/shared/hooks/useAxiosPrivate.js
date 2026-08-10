import { useEffect } from "react";
import axiosClient from "../api-client/AxiosClient";
import { useAuth } from "./useAuth";

let responseInterceptorId = null;
let privateHookSubscribers = 0;
let pendingRefresh = null;
let latestRefreshAccessToken = null;
let latestLogout = null;

export const useAxiosPrivate = () => {
    const { refreshAccessToken, logout } = useAuth();

    useEffect(() => {
        latestRefreshAccessToken = refreshAccessToken;
        latestLogout = logout;
    }, [refreshAccessToken, logout]);

    useEffect(() => {
        privateHookSubscribers += 1;

        if (responseInterceptorId === null) {
            responseInterceptorId = axiosClient.interceptors.response.use(
                (response) => response,
                async (error) => {
                    const originalRequest = error.config;
                    const requestUrl = originalRequest?.url || "";
                    const isAuthRequest = requestUrl.includes("/auth/");

                    if (!originalRequest || isAuthRequest) {
                        return Promise.reject(error);
                    }

                    if (
                        error.response?.status === 401 &&
                        !originalRequest._retry
                    ) {
                        originalRequest._retry = true;

                        try {
                            if (!pendingRefresh) {
                                pendingRefresh =
                                    latestRefreshAccessToken().finally(() => {
                                        pendingRefresh = null;
                                    });
                            }

                            const nextAccessToken = await pendingRefresh;
                            if (nextAccessToken) {
                                originalRequest.headers = {
                                    ...originalRequest.headers,
                                    Authorization: `Bearer ${nextAccessToken}`,
                                };
                            }
                            return axiosClient(originalRequest);
                        } catch (refreshError) {
                            await latestLogout();
                            return Promise.reject(refreshError);
                        }
                    }

                    return Promise.reject(error);
                }
            );
        }

        return () => {
            privateHookSubscribers -= 1;

            if (
                privateHookSubscribers === 0 &&
                responseInterceptorId !== null
            ) {
                axiosClient.interceptors.response.eject(responseInterceptorId);
                responseInterceptorId = null;
                pendingRefresh = null;
            }
        };
    }, []);

    return axiosClient;
};
