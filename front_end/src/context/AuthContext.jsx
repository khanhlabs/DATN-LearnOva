import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { loginApi, logoutApi, refreshApi } from "../api/auth/AuthApi.js";
import { getCurrentUserApi, switchActiveRoleApi } from "../api/user/UserApi.js";
import { mergeGuestCartToServer } from "../utils/cartStorage.js";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {

    const [accessToken, setAccessToken] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const sessionVersionRef = useRef(0);
    const pendingRefreshRef = useRef(null);

    const fetchCurrentUser = async () => {
        const user = await getCurrentUserApi();
        setCurrentUser(user);
        return user;
    };

    const login = async (email, password, remember) => {
        sessionVersionRef.current++;
        const data = await loginApi(email, password, remember);
        setAccessToken(data.accessToken);

        let user = null;
        try {
            user = await fetchCurrentUser();
        } catch (e) {
            console.error("Failed to fetch user after auth", e);
        }

        // Guest cart (local) → SQL, rồi xóa local
        try {
            await mergeGuestCartToServer(data.accessToken);
        } catch (e) {
            console.error("Failed to merge guest cart after login", e);
        }

        return { ...data, user };
    };

    const switchActiveRole = async (role) => {
        const user = await switchActiveRoleApi(role);
        setCurrentUser(user);
        return user;
    };

    const refreshAccessToken = useCallback(async () => {
        if (pendingRefreshRef.current) {
            return pendingRefreshRef.current;
        }
        pendingRefreshRef.current = refreshApi()
            .then((data) => {
                setAccessToken(data.accessToken);
                return data.accessToken;
            })
            .finally(() => {
                pendingRefreshRef.current = null;
            });
        return pendingRefreshRef.current;
    }, []);

    const logout = useCallback(async () => {
        sessionVersionRef.current++;
        try {
            await logoutApi();
        } finally {
            setAccessToken(null);
            setCurrentUser(null);
            // Notify parts of the app (e.g. the chat widget) that this was a real,
            // user-initiated logout — distinct from a transient isAuthenticated
            // flicker during session restore on page load.
            window.dispatchEvent(new Event("learnova:logout"));
        }
    }, []);

    useEffect(() => {
        const myVersion = ++sessionVersionRef.current;

        const restoreSession = async () => {
            try {
                await refreshAccessToken();
                if (sessionVersionRef.current !== myVersion) return; // auth() was called, bail
                await fetchCurrentUser();
                try {
                    const token = await refreshAccessToken();
                    if (sessionVersionRef.current !== myVersion) return;
                    await mergeGuestCartToServer(token);
                } catch (e) {
                    console.error("Failed to merge guest cart on session restore", e);
                }
            } catch {
                if (sessionVersionRef.current !== myVersion) return;
                setAccessToken(null);
                setCurrentUser(null);
            } finally {
                if (sessionVersionRef.current === myVersion) {
                    setLoading(false);
                }
            }
        };

        restoreSession();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                accessToken,
                currentUser,
                setCurrentUser,
                isAuthenticated: !!accessToken,
                loading,
                login,
                logout,
                refreshAccessToken,
                fetchCurrentUser,
                switchActiveRole,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
