import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {User, BookOpen, Heart, Shield, LogOut, Repeat, GraduationCap,} from "lucide-react";
import HeaderDropdown from "./HeaderDropdown.jsx";
import {useUserData} from "../data/UserData.js";
import {useAuth} from "../../../../../hook/useAuth.jsx";

const AvatarDropdown = () => {
  const { t } = useTranslation();
  const user = useUserData();
  const { logout, switchActiveRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/learnova/auth/login");
  };

  const isAdmin = user.roles.includes("ROLE_ADMIN");
  const canSwitchToTeacher = user.roles.includes("ROLE_TEACHER");

  const handleSwitchToTeacher = async () => {
    await switchActiveRole("ROLE_TEACHER");
    navigate("/learnova/teacher");
  };

  return (
    <div className="user-logged-avatar-menu">
      <button type="button" className="user-logged-avatar-button" aria-label="Open user menu">
        <img src={user.avatar} alt={user.name} />
      </button>

      <HeaderDropdown align="right" className="user-logged-profile-dropdown">
        <div className="user-logged-profile-card">
          <img src={user.avatar} alt={user.name} />
          <div>
            <strong>{user.name}</strong>
            <span>
              {user.roles && user.roles.length > 0
                ? user.roles[0].replace("ROLE_", "")
                : "Active learner"}
            </span>
          </div>
        </div>

        <ul className="user-logged-menu-list">
          <li>
            <Link to="/learnova/user/profile" className="user-logged-menu-link">
              <User size={16} />
              {t("profile.sidebar.profile")}
            </Link>
          </li>
          <li>
            <Link to="/learnova/user/profile/courses" className="user-logged-menu-link">
              <BookOpen size={16} />
              {t("profile.sidebar.courses")}
            </Link>
          </li>
          <li>
            <Link to="/learnova/user/profile/favorites" className="user-logged-menu-link">
              <Heart size={16} />
              {t("profile.sidebar.favorites")}
            </Link>
          </li>
          <li>
            <Link
                to="/learnova/user/profile/security"
                className="user-logged-menu-link"
            >
              <Shield size={16} />
              {t("profile.sidebar.security")}
            </Link>
          </li>
          {!isAdmin && canSwitchToTeacher && (
            <li className="user-logged-menu-separator">
              <button type="button" className="user-logged-menu-link" onClick={handleSwitchToTeacher}>
                <Repeat size={16} />
                Chuyển sang Giảng viên
              </button>
            </li>
          )}
          {!isAdmin && !canSwitchToTeacher && (
            <li className="user-logged-menu-separator">
              <Link to="/learnova/apply-teacher" className="user-logged-menu-link">
                <GraduationCap size={16} />
                Đăng ký trở thành giảng viên
              </Link>
            </li>
          )}
          <li>
            <button type="button" className="user-logged-menu-link is-danger" onClick={handleLogout}>
              <LogOut size={16} />
              {t("profile.sidebar.logout")}
            </button>
          </li>
        </ul>
      </HeaderDropdown>
    </div>
  );
};

export default AvatarDropdown;
