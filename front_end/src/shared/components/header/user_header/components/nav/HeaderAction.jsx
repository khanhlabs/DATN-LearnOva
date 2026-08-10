import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ShoppingCart } from "lucide-react";
import LanguageSwitcher from "../language/LanguageSwitcher";
import {
  CART_UPDATED_EVENT,
  getStoredCartItems,
} from "../../../../../utils/cartStorage";

const HeaderAction = () => {
  const { t } = useTranslation();
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const loadCount = () => {
      setTotalItems(getStoredCartItems().length);
    };

    loadCount();
    window.addEventListener(CART_UPDATED_EVENT, loadCount);
    window.addEventListener("storage", loadCount);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, loadCount);
      window.removeEventListener("storage", loadCount);
    };
  }, []);

  return (
    <div className="header-section">
      <Link
        to="/learnova/cart"
        className="header-action-cart"
        style={{ position: "relative", display: "inline-flex" }}
      >
        <ShoppingCart size={22} />
        {totalItems > 0 && (
          <span className="user-logged-badge">{totalItems}</span>
        )}
      </Link>

      <Link to="/learnova/auth/login" className="header-action-login">
        {t("header.login")}
      </Link>

      <Link to="/learnova/auth/login?mode=register" className="header-action-signup">
        {t("header.signup")}
      </Link>

      <LanguageSwitcher />
    </div>
  );
};

export default HeaderAction;
