import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useAuth } from "../../../../hook/UseAuth.jsx";
import { useAxiosPrivate } from "../../../../hook/UseAxiosPrivate.js";
import { getMyCartApi } from "../../../../api/CartApi.js";
import {
  CART_UPDATED_EVENT,
  getStoredCartItems,
} from "../../../../utils/cartStorage.js";

const CartDropdown = () => {
  const { accessToken, isAuthenticated, loading } = useAuth();
  const axiosPrivate = useAxiosPrivate();
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const loadCount = async () => {
      if (loading) return;

      if (!isAuthenticated) {
        setTotalItems(getStoredCartItems().length);
        return;
      }

      try {
        const data = await getMyCartApi(axiosPrivate, accessToken);
        setTotalItems(Array.isArray(data) ? data.length : 0);
      } catch {
        setTotalItems(0);
      }
    };

    loadCount();
    window.addEventListener(CART_UPDATED_EVENT, loadCount);
    window.addEventListener("storage", loadCount);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, loadCount);
      window.removeEventListener("storage", loadCount);
    };
  }, [accessToken, axiosPrivate, isAuthenticated, loading]);

  return (
    <Link
      to="/learnova/cart"
      className="user-logged-icon-button user-logged-cart-link"
      aria-label="Open cart"
    >
      <ShoppingCart size={21} />
      {totalItems > 0 && (
        <span className="user-logged-badge">{totalItems}</span>
      )}
    </Link>
  );
};

export default CartDropdown;
