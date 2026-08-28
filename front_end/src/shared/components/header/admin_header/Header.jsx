import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, LogOut, Settings, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import i18n, { LANGUAGE_STORAGE_KEY } from "../../../../app/i18n/i18n";
import { Link, useLocation, useNavigate } from "react-router-dom";
import defaultAvatar from "../../../../assets/image/DefaultAvatar.jpg";
import { useAuth } from "../../../hooks/useAuth";
import NotificationBell from "./NotificationBell";
import "./Header.css";

const formatRoleName = (roles = []) => {
  const role = roles[0];
  if (!role) return "Administrator";
  return role.replace("ROLE_", "").toLowerCase().replace(/^\w/, (char) => char.toUpperCase());
};

const Header = () => {
  const { t } = useTranslation();
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const adminProfile = useMemo(() => {
    const displayName = currentUser?.fullName || currentUser?.email || "Admin";
    return {
      displayName,
      email: currentUser?.email || "",
      roleName: formatRoleName(currentUser?.roles),
      avatarUrl: currentUser?.avatar || defaultAvatar,
    };
  }, [currentUser]);

  useEffect(() => {
    if (!isProfileOpen) return undefined;

    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileOpen]);

  const handleLogout = async () => {
    await logout();
    setIsProfileOpen(false);
    navigate("/learnova/auth/login");
  };

  let title = "";

  const normPath = pathname.replace(/\/$/, "");

  if (normPath === "/learnova/admin") {
    title = t("admin.overview");
  } else if (normPath === "/learnova/admin/users") {
    title = t("admin.users");
  } else if (normPath === "/learnova/admin/teachers") {
    title = t("admin.instructors");
  } else if (normPath === "/learnova/admin/courses") {
    title = t("admin.courses");
  } else if (normPath === "/learnova/admin/categories") {
    title = t("admin.categories");
  } else if (normPath.startsWith("/learnova/admin/course-approval")) {
    title = t("admin.courseApproval");
  } else if (normPath.startsWith("/learnova/admin/teacher-applications")) {
    title = t("admin.teacherApplications");
  } else if (normPath.startsWith("/learnova/admin/revenue")) {
    title = t("admin.revenue");
  } else if (normPath === "/learnova/admin/vouchers") {
    title = t("admin.vouchers");
  } else if (normPath === "/learnova/admin/violation-reports") {
    title = t("admin.violationReports");
  } else if (normPath === "/learnova/admin/settings") {
    title = t("admin.settings");
  } else if (normPath.startsWith("/learnova/admin/profile")) {
    title = t("admin.profile");
  } else {
    title = t("admin.dashboard");
  }

  return (
    <header className="admin-topbar">
      <div className="admin-topbar__intro">
        <h1>{title}</h1>
      </div>

      <div className="admin-topbar__actions">
        <button type="button" className="admin-language-switch" aria-label={t("admin.language")} onClick={() => { const next = i18n.language === "vi" ? "en" : "vi"; i18n.changeLanguage(next); localStorage.setItem(LANGUAGE_STORAGE_KEY, next); }}>
          {i18n.language === "vi" ? "EN" : "VI"}
        </button>
        <NotificationBell />
        <Link
          to="/learnova/admin/settings"
          aria-label="Settings"
          className="admin-topbar__btn"
        >
          <Settings size={20} />
        </Link>
        <div className="admin-profile-wrap" ref={profileRef}>
          <button
            type="button"
            className="admin-profile"
            aria-label="Open admin profile menu"
            aria-expanded={isProfileOpen}
            onClick={() => setIsProfileOpen((prev) => !prev)}
          >
            <img
              src={adminProfile.avatarUrl}
              alt={adminProfile.displayName}
              onError={(event) => {
                event.currentTarget.src = defaultAvatar;
              }}
            />
            <span>{adminProfile.displayName}</span>
            <ChevronDown size={16} />
          </button>

          {isProfileOpen && (
            <div className="admin-profile-dropdown">
              <div className="admin-profile-card">
                <img
                  src={adminProfile.avatarUrl}
                  alt={adminProfile.displayName}
                  onError={(event) => {
                    event.currentTarget.src = defaultAvatar;
                  }}
                />
                <div>
                  <strong>{adminProfile.displayName}</strong>
                  <span>{adminProfile.email || adminProfile.roleName}</span>
                </div>
              </div>

              <ul className="admin-profile-menu">
                <li>
                  <Link
                    to="/learnova/admin/profile"
                    className="admin-profile-menu__item"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <User size={16} />
                    {t("admin.profile")}
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    className="admin-profile-menu__item admin-profile-menu__item--danger"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    {t("admin.logout")}
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
