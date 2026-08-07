import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Tag, Trash2, X } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Cart.css";
import { applyVoucherApi } from "../../../api/courses/VoucherApi.js";
import { createPaymentApi } from "../../../api/payment/PaymentApi.js";
import { getPublicCoursesApi } from "../../../api/courses/CourseApi.js";
import { getMyCartApi, removeCartItemApi } from "../../../api/cart/CartApi.js";
import PaymentModal from "../../../component/payment/PaymentModal.jsx";
import { useAuth } from "../../../hook/useAuth.jsx";
import { useAxiosPrivate } from "../../../hook/useAxiosPrivate.js";
import {
  CART_UPDATED_EVENT,
  getStoredCartItems,
  mapCartApiItem,
  removeStoredCartItem,
  setStoredCartItems,
} from "../../../utils/cartStorage.js";

/** Catalog prices are USD. */
function toUsdNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatUsd(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(toUsdNumber(amount));
}

function normalizeTitle(title) {
  return String(title || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

const Cart = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();
  const { accessToken, isAuthenticated, loading: authLoading } = useAuth();

  const [items, setItems] = useState([]);
  const [dbCourses, setDbCourses] = useState([]);
  const [promo, setPromo] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherMessage, setVoucherMessage] = useState("");
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [activePayment, setActivePayment] = useState(null);
  const [itemToRemove, setItemToRemove] = useState(null);

  // Load cart: guest = localStorage, logged-in = API
  const loadCartItems = async () => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setItems(getStoredCartItems());
      return;
    }

    try {
      const data = await getMyCartApi(axiosPrivate, accessToken);
      setItems(Array.isArray(data) ? data.map(mapCartApiItem) : []);
    } catch {
      setItems(getStoredCartItems());
    }
  };

  useEffect(() => {
    loadCartItems();

    const onCartChange = () => {
      loadCartItems();
      setAppliedVoucher(null);
      setVoucherMessage("");
    };

    window.addEventListener(CART_UPDATED_EVENT, onCartChange);
    window.addEventListener("storage", onCartChange);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, onCartChange);
      window.removeEventListener("storage", onCartChange);
    };
  }, [authLoading, isAuthenticated, accessToken]);

  useEffect(() => {
    getPublicCoursesApi()
      .then((data) => setDbCourses(Array.isArray(data) ? data : []))
      .catch(() => setDbCourses([]));
  }, []);

  const closeRemovePopup = () => setItemToRemove(null);

  const subtotal = items.reduce((sum, item) => sum + toUsdNumber(item.price), 0);
  const discount = Number(appliedVoucher?.discountAmount || 0);
  const total = Math.max(0, subtotal - discount);

  const findCheckoutCourse = (item) => {
    const rawId = item.courseId ?? item.id;
    const byId = dbCourses.find((course) => String(course.courseId) === String(rawId));
    if (byId) return byId;

    const title = normalizeTitle(item.title);
    if (!title) return null;
    return dbCourses.find((course) => normalizeTitle(course.title) === title) || null;
  };

  const confirmRemoveItem = async () => {
    if (!itemToRemove) return;

    const courseId = itemToRemove.courseId ?? itemToRemove.id;
    const title = itemToRemove.title;

    try {
      if (isAuthenticated) {
        await removeCartItemApi(axiosPrivate, courseId, accessToken);
        await loadCartItems();
        window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
      } else {
        setItems(removeStoredCartItem(courseId));
      }

      setAppliedVoucher(null);
      setVoucherMessage("");
      closeRemovePopup();
      toast.success(t("cart.removedFromCart", { title }));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to remove course from cart.");
    }
  };

  const handleVoucherChange = (event) => {
    setPromo(event.target.value);
    setAppliedVoucher(null);
    setVoucherMessage("");
  };

  const handleApplyVoucher = async () => {
    const code = promo.trim();

    if (!code) {
      setVoucherMessage(t("cart.enterVoucherCode"));
      return;
    }
    if (items.length === 0 || subtotal <= 0) {
      setVoucherMessage(t("cart.cartEmpty"));
      return;
    }
    if (appliedVoucher?.code?.toLowerCase() === code.toLowerCase()) {
      setVoucherMessage(t("cart.voucherAlreadyApplied"));
      return;
    }

    try {
      setIsApplyingVoucher(true);
      setVoucherMessage("");
      const result = await applyVoucherApi({ code, subtotal });
      setAppliedVoucher(result);
      setVoucherMessage(
        t("cart.voucherApplied", {
          code: result.code,
          usedCount: result.usedCount,
          usageLimit: result.usageLimit,
        }),
      );
      toast.success(t("cart.voucherAppliedSuccess"));
    } catch (err) {
      setAppliedVoucher(null);
      const message = err?.response?.data?.message || t("cart.voucherInvalid");
      setVoucherMessage(message);
      toast.error(message);
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const handleCheckout = async () => {
    if (authLoading) return;

    if (!isAuthenticated) {
      toast.error(t("cart.loginToCheckout"));
      return;
    }
    if (items.length === 0) {
      toast.error(t("cart.cartEmpty"));
      return;
    }

    // Free cart (or voucher to $0): still checkout — server enrolls without PayOS
    const checkoutPairs = items
      .map((item) => ({ item, course: findCheckoutCourse(item) }))
      .filter((pair) => pair.course);

    if (checkoutPairs.length !== items.length) {
      toast.error(t("cart.coursesUnavailable"));
      return;
    }

    const courseIds = checkoutPairs.map((pair) => pair.course.courseId);

    try {
      setIsCreatingPayment(true);
      const payment = await createPaymentApi(
        axiosPrivate,
        {
          courseIds,
          voucherCode: promo.trim() || null,
        },
        accessToken,
      );

      if (
        payment?.orderStatus === "PAID" ||
        payment?.paymentStatus === "SUCCESS" ||
        payment?.paymentMethod === "FREE"
      ) {
        const paidIds = checkoutPairs.map((pair) => pair.item.id);
        if (isAuthenticated) {
          for (const id of paidIds) {
            try {
              await removeCartItemApi(axiosPrivate, id, accessToken);
            } catch {
              // ignore
            }
          }
        } else {
          setStoredCartItems([]);
        }
        window.dispatchEvent(new Event(CART_UPDATED_EVENT));
        await loadCartItems();
        toast.success("Enrolled for free. Opening My Courses…");
        navigate("/learnova/user/profile/courses");
        return;
      }

      setActivePayment({
        ...payment,
        cartItemIds: checkoutPairs.map((pair) => pair.item.id),
      });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        t("cart.paymentCreateError");
      toast.error(msg, { autoClose: 4000 });
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const handlePaymentPaid = async () => {
    if (!activePayment) return;

    const paidIds = new Set(
      (activePayment.cartItemIds || [
        activePayment.cartItemId || activePayment.courseId,
      ]).map(String),
    );

    if (isAuthenticated) {
      for (const id of paidIds) {
        try {
          await removeCartItemApi(axiosPrivate, id, accessToken);
        } catch {
          // ignore single remove failure
        }
      }
      await loadCartItems();
      window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
    } else {
      const nextItems = getStoredCartItems().filter(
        (item) => !paidIds.has(String(item.courseId ?? item.id)),
      );
      setItems(setStoredCartItems(nextItems));
    }

    setAppliedVoucher(null);
    setVoucherMessage("");
  };

  return (
    <div className="cart-page">
      <div className="cart-panel">
        <div className="cart-left">
          <div className="cart-list">
            <div className="cart-list-header">
              <div>{t("cart.colCourse")}</div>
              <div>{t("cart.colPrice")}</div>
              <div>{t("cart.colQuantity")}</div>
              <div>{t("cart.colTotal")}</div>
              <div>{t("cart.colActions")}</div>
            </div>

            {items.length === 0 && (
              <div className="cart-empty">
                <p>{t("cart.emptyMessage")}</p>
                <Link to="/learnova/courses">{t("cart.continueBrowsing")}</Link>
              </div>
            )}

            {items.map((item) => {
              const courseId = item.courseId ?? item.id;
              const priceText = formatUsd(item.price);

              return (
                <div className="cart-item" key={courseId}>
                  <div className="cart-item-course">
                    <img src={item.image} alt={item.title} />
                    <div>
                      <Link
                        to={`/learnova/user/courses-detail/${courseId}`}
                        className="cart-item-title"
                      >
                        {item.title}
                      </Link>
                      <div className="cart-item-teacher">
                        {t("cart.byInstructor", { name: item.teacher })}
                      </div>
                    </div>
                  </div>

                  <div className="cart-item-price">{priceText}</div>
                  <div className="cart-item-qty">
                    <span className="qty-num">1</span>
                  </div>
                  <div className="cart-item-total">{priceText}</div>

                  <button
                    className="cart-item-remove"
                    type="button"
                    aria-label={t("cart.removeAria", { title: item.title })}
                    onClick={() => setItemToRemove(item)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="cart-right">
          <div className="order-card">
            <h3>{t("cart.orderSummary")}</h3>

            <div className="order-row">
              <span>{t("cart.subtotal", { count: items.length })}</span>
              <span>{formatUsd(subtotal)}</span>
            </div>

            <div className="order-row">
              <span>{t("cart.discount")}</span>
              <span className="discount">-{formatUsd(discount)}</span>
            </div>

            <div className="voucher-box">
              <label htmlFor="voucher-code">{t("cart.voucherLabel")}</label>
              <div className="voucher-input-wrap">
                <Tag size={18} />
                <input
                  id="voucher-code"
                  type="text"
                  value={promo}
                  onChange={handleVoucherChange}
                  placeholder={t("cart.voucherPlaceholder")}
                />
                <button
                  type="button"
                  className="voucher-apply-btn"
                  onClick={handleApplyVoucher}
                  disabled={isApplyingVoucher}
                >
                  {isApplyingVoucher ? t("cart.applying") : t("cart.apply")}
                </button>
              </div>
              {voucherMessage ? (
                <p
                  className={`voucher-message ${
                    appliedVoucher ? "voucher-message--success" : "voucher-message--error"
                  }`}
                >
                  {voucherMessage}
                </p>
              ) : null}
            </div>

            <div className="order-total">
              <span>{t("cart.total")}</span>
              <span className="total-amount">{formatUsd(total)}</span>
            </div>

            <button
              className="checkout"
              type="button"
              onClick={handleCheckout}
              disabled={isCreatingPayment || items.length === 0}
            >
              {isCreatingPayment
                ? total <= 0
                  ? "Enrolling..."
                  : t("cart.creatingPayment")
                : total <= 0
                  ? "Enroll for free"
                  : t("cart.proceedToCheckout")}
            </button>

            <button
              className="continue"
              type="button"
              onClick={() => navigate("/learnova/courses")}
            >
              {t("cart.continueShopping")}
            </button>
          </div>
        </aside>
      </div>

      {itemToRemove && (
        <div className="cart-popup-backdrop" role="presentation">
          <div
            className="cart-confirm-popup"
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-cart-title"
          >
            <button
              className="cart-popup-close"
              type="button"
              onClick={closeRemovePopup}
              aria-label={t("cart.closePopup")}
            >
              <X size={18} />
            </button>

            <div className="cart-popup-icon">
              <AlertTriangle size={26} />
            </div>

            <h3 id="remove-cart-title">{t("cart.removeTitle")}</h3>
            <p>
              {t("cart.removeConfirm")}{" "}
              <strong>{itemToRemove.title}</strong> {t("cart.removeConfirmSuffix")}
            </p>

            <div className="cart-popup-actions">
              <button
                className="cart-popup-cancel"
                type="button"
                onClick={closeRemovePopup}
              >
                {t("cart.cancel")}
              </button>
              <button
                className="cart-popup-confirm"
                type="button"
                onClick={confirmRemoveItem}
              >
                {t("cart.remove")}
              </button>
            </div>
          </div>
        </div>
      )}

      {activePayment && (
        <PaymentModal
          payment={activePayment}
          onClose={() => setActivePayment(null)}
          onPaid={handlePaymentPaid}
        />
      )}

      <ToastContainer
        position="top-right"
        autoClose={4000}
        newestOnTop
        closeOnClick
        pauseOnHover={false}
        draggable
        limit={3}
      />
    </div>
  );
};

export default Cart;
