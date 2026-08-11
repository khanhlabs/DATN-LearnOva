import { useEffect, useRef } from "react";
import axiosClient from "../../shared/api-client/AxiosClient";
import { useAuth } from "../../shared/hooks/useAuth";

const AxiosInterceptor = ({ children }) => {
    const { refreshAccessToken, logout } = useAuth();

    // Use refs so the effect only runs once, but always calls the latest function
    const refreshRef = useRef(refreshAccessToken);
    const logoutRef = useRef(logout);
    useEffect(() => { refreshRef.current = refreshAccessToken; }, [refreshAccessToken]);
    useEffect(() => { logoutRef.current = logout; }, [logout]);

    useEffect(() => {
        // Single in-flight refresh promise — prevents duplicate refresh calls
        // when multiple 401s arrive simultaneously
        let pendingRefresh = null;

        const requestInterceptor = axiosClient.interceptors.request.use(
            (config) => config,
            (error) => Promise.reject(error)
        );

        const responseInterceptor = axiosClient.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;
                const requestUrl = originalRequest?.url || "";
                const isRefreshRequest = requestUrl.includes("/auth/refresh");

                if (!originalRequest || isRefreshRequest) {
                    return Promise.reject(error);
                }

                // Never intercept auth endpoints — they don't need token refresh
                // and doing so would create an infinite retry loop
                const isAuthEndpoint = originalRequest.url?.includes("/auth/");
                if (isAuthEndpoint) {
                    return Promise.reject(error);
                }

                if (
                    (error.response?.status === 401 || error.response?.status === 403) &&
                    !originalRequest._retry
                ) {
                    originalRequest._retry = true;

                    try {
                        if (!pendingRefresh) {
                            pendingRefresh = refreshRef.current().finally(() => {
                                pendingRefresh = null;
                            });
                        }
                        await pendingRefresh;
                        return axiosClient(originalRequest);
                    } catch (refreshError) {
                        await logoutRef.current();
                        return Promise.reject(refreshError);
                    }
                }

                return Promise.reject(error);
            }
        );

        return () => {
            axiosClient.interceptors.request.eject(requestInterceptor);
            axiosClient.interceptors.response.eject(responseInterceptor);
        };
    }, []); // Run once — refs keep the functions up to date

    return children;
};

export default AxiosInterceptor;
