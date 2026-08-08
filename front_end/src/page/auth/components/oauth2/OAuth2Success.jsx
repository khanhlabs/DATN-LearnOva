import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../hook/useAuth.jsx";

// After Google / Facebook OAuth2 auth the backend sets HttpOnly auth cookies
// and redirects here with no tokens in the URL. We restore session the same way
// a normal page refresh does: call /auth/refresh (cookie is already set), then
// load the current user.
const OAuth2Success = () => {
    const navigate = useNavigate();
    const { refreshAccessToken, fetchCurrentUser } = useAuth();

    useEffect(() => {
        const restoreOAuthSession = async () => {
            try {
                await refreshAccessToken();
                const user = await fetchCurrentUser();

                const roles = user?.roles ?? [];
                const activeRole = user?.activeRole;
                // A stale activeRole (e.g. left over after a role was revoked) must not
                // send the user into a dashboard they no longer have access to.
                const effectiveRole = roles.includes("ROLE_ADMIN")
                    ? "ROLE_ADMIN"
                    : activeRole && roles.includes(activeRole)
                        ? activeRole
                        : null;

                if (effectiveRole === "ROLE_ADMIN") {
                    navigate("/learnova/admin", { replace: true });
                } else if (effectiveRole === "ROLE_TEACHER") {
                    navigate("/learnova/teacher", { replace: true });
                } else {
                    navigate("/learnova/courses", { replace: true });
                }
            } catch {
                // Cookies missing or invalid — send back to auth.
                navigate("/learnova/auth/auth", { replace: true });
            }
        };

        restoreOAuthSession();
    }, []);

    return null;
};

export default OAuth2Success;
