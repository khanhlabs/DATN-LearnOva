import {useAuth} from "../../../../../hook/useAuth.jsx";
import defaultAvatar from "../../../../../assets/image/DefaultAvatar.jpg"


export const useUserData = () => {
  const { currentUser } = useAuth();

  return {
    name: currentUser?.fullName || "Guest User",
    avatar: currentUser?.avatar || defaultAvatar,
    roles: currentUser?.roles || [],
    activeRole: currentUser?.activeRole,
  };
};

