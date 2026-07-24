import {useAuth} from "../../../../hook/UseAuth.jsx";
import defaultAvatar from "../../../../assets/default_avatar.jpg"


export const useUserData = () => {
  const { currentUser } = useAuth();

  return {
    name: currentUser?.fullName || "Guest User",
    avatar: currentUser?.avatar || defaultAvatar,
    roles: currentUser?.roles || [],
    activeRole: currentUser?.activeRole,
  };
};

