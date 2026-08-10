import { Navigate } from "react-router-dom";
import { useAuth } from "../../shared/hooks/useAuth";

const RequireRole = ({ role, children }) => {
  const { isAuthenticated, currentUser, loading } = useAuth();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/learnova/auth/login" replace />;
  }

  const roles = currentUser?.roles ?? [];
  const activeRole = currentUser?.activeRole;
  // Mirror the backend's CustomUserDetails.getAuthorities(): activeRole only grants
  // access when it's actually one of the user's currently held roles. A stale
  // activeRole left over after a role was revoked must not unlock its route.
  const activeRoleStillValid = activeRole && roles.includes(activeRole);
  const hasAccess = !role || (activeRoleStillValid ? activeRole === role : roles.includes(role));

  if (role && !hasAccess) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RequireRole;
