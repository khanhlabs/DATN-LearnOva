import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logo from "../../../../../assets/logo/LogoText.png";
import AvatarDropdown from "../components/dropdown/AvatarDropdown";
import CartDropdown from "../components/dropdown/CartDropdown";
import HeaderSearch from "../components/search/HeaderSearch";
import NotificationDropdown from "../components/dropdown/NotificationDropdown";
import LanguageSwitcher from "../components/language/LanguageSwitcher";
import "./LoggedInHeader";

const LoggedInHeader = () => {
  const { t } = useTranslation();

  return (
    <header className="user-logged-header">
      <div className="user-logged-header-container">
        <div className="user-logged-brand-group">
          <Link to="/" className="user-logged-logo">
            <img src={logo} alt="Learnova" />
          </Link>
        </div>

        <div className="user-logged-home-shell">
          <Link to="/learnova/home" className="user-logged-home-link">
            {t("header.home")}
          </Link>

          <Link to="/learnova/courses" className="user-logged-nav-button">
            {t("header.courses")}
          </Link>
        </div>

        <div className="user-logged-search-area">
          <HeaderSearch  />
        </div>

        <nav className="user-logged-secondary-nav" aria-label="Secondary navigation">
          <Link to="/learnova/user/profile/courses" className="user-logged-nav-button">
            {t("header.myLearning")}
          </Link>
          <Link to="/learnova/intructors" className="user-logged-nav-button">
            {t("header.instructors")}
          </Link>
          <Link to="/learnova/home" className="user-logged-nav-button">
            {t("header.subscribe")}
          </Link>
        </nav>

        <div className="user-logged-actions">
          <LanguageSwitcher />
          <CartDropdown />
          <NotificationDropdown  />
          <AvatarDropdown />
        </div>
      </div>
    </header>
  );
};

export default LoggedInHeader;
