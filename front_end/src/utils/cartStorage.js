import axiosClient from "../api/AxiosClient.js";
import {
  addCartItemApi,
  getMyCartApi,
  mergeCartApi,
} from "../api/CartApi.js";

const CART_STORAGE_KEY = "learnova_cart_items";
export const CART_UPDATED_EVENT = "learnova-cart-updated";

function notifyCartUpdated(items) {
  window.dispatchEvent(
    new CustomEvent(CART_UPDATED_EVENT, {
      detail: { items },
    }),
  );
}

// API row -> UI row
export function mapCartApiItem(apiItem) {
  return {
    id: apiItem.courseId,
    courseId: apiItem.courseId,
    title: apiItem.title,
    teacher: apiItem.teacher,
    price: apiItem.price,
    image: apiItem.image,
    qty: 1,
  };
}

export function getStoredCartItems() {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    const items = raw ? JSON.parse(raw) : [];
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export function getStoredCartCourseIds() {
  return getStoredCartItems()
    .map((item) => Number(item.courseId ?? item.id))
    .filter((id) => id > 0);
}

export function setStoredCartItems(items) {
  const nextItems = Array.isArray(items) ? items : [];
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(nextItems));
  notifyCartUpdated(nextItems);
  return nextItems;
}

export function clearStoredCartItems() {
  window.localStorage.removeItem(CART_STORAGE_KEY);
  notifyCartUpdated([]);
  return [];
}

// Chỉ dùng khi guest (chưa login)
export function addStoredCartItem(course) {
  const courseId = Number(course.courseId ?? course.id);
  const currentItems = getStoredCartItems();

  const alreadyInCart = currentItems.some(
    (item) => Number(item.courseId ?? item.id) === courseId,
  );

  if (alreadyInCart) {
    return { alreadyInCart: true, items: currentItems };
  }

  const nextItems = [
    ...currentItems,
    {
      id: courseId,
      courseId,
      title: course.title,
      teacher: course.teacher,
      price: course.price,
      image: course.image,
      qty: 1,
    },
  ];

  setStoredCartItems(nextItems);
  return { alreadyInCart: false, items: nextItems };
}

export function removeStoredCartItem(courseId) {
  const nextItems = getStoredCartItems().filter(
    (item) => Number(item.courseId ?? item.id) !== Number(courseId),
  );
  return setStoredCartItems(nextItems);
}

/**
 * Thêm vào giỏ:
 * - chưa login  → localStorage
 * - đã login    → SQL (API), xóa local còn sót
 */
export async function addCourseToCart(course, { isAuthenticated, accessToken }) {
  const courseId = Number(course.courseId ?? course.id);

  if (!courseId) {
    return { ok: false, alreadyInCart: false };
  }

  // Guest
  if (!isAuthenticated) {
    return addStoredCartItem({
      courseId,
      title: course.title,
      teacher: course.teacher,
      price: course.price,
      image: course.image,
    });
  }

  // Logged in → DB only
  clearStoredCartItems();

  const serverCart = await getMyCartApi(axiosClient, accessToken);
  const alreadyInCart = Array.isArray(serverCart)
    && serverCart.some((item) => Number(item.courseId) === courseId);

  if (alreadyInCart) {
    notifyCartUpdated(serverCart.map(mapCartApiItem));
    return { alreadyInCart: true, items: serverCart.map(mapCartApiItem) };
  }

  await addCartItemApi(axiosClient, courseId, accessToken);
  const updated = await getMyCartApi(axiosClient, accessToken);
  const items = Array.isArray(updated) ? updated.map(mapCartApiItem) : [];
  notifyCartUpdated(items);
  return { alreadyInCart: false, items };
}

/** Sau login: local courseIds → SQL, rồi xóa local */
export async function mergeGuestCartToServer(accessToken) {
  const courseIds = getStoredCartCourseIds();
  if (courseIds.length === 0) {
    return [];
  }

  const merged = await mergeCartApi(axiosClient, courseIds, accessToken);
  clearStoredCartItems();

  const items = Array.isArray(merged) ? merged.map(mapCartApiItem) : [];
  notifyCartUpdated(items);
  return items;
}
