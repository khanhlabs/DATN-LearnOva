import { NavLink } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { sidebarItems } from "../data/profileData";

const ProfileSidebar = () => {
  const { t } = useTranslation();

  return (
    <aside className="profile-sidebar">
      <div className="sidebar-content">
        <div className="sidebar-header">
          <h2>{t("profile.sidebar.account")}</h2>
          <Sparkles size={18} />
        </div>

        <nav className="sidebar-nav">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <Icon size={16} />
                <span>{t(`profile.sidebar.${item.id}`)}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default ProfileSidebar;
