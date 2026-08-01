import axiosClient from "./AxiosClient.js";
import { toast } from "react-toastify";

export const ADMIN_NOTIFICATIONS_CHANGED = "learnova:admin-notifications-changed";

export const getMyNotificationsApi = async (page = 0, size = 20, client = axiosClient) => {
  const response = await client.get("/notifications", { params: { page, size } });
  const pageData = response.data;
  if (Array.isArray(pageData)) return pageData;
  if (Array.isArray(pageData?.content)) return pageData.content;
  if (Array.isArray(pageData?.page?.content)) return pageData.page.content;
  return [];
};

export const getUnreadCountApi = async (client = axiosClient) => {
  const response = await client.get("/notifications/unread-count");
  return response.data;
};

export const createSelfNotificationApi = async (payload, client = axiosClient) => {
  const response = await client.post("/notifications/self", payload);
  return response.data;
};

/** Admin toast + write into the admin notification bell (no extra util file). */
export const adminNotifySuccess = async (message, { title = "Admin action", link } = {}) => {
  toast.success(message);
  try {
    await createSelfNotificationApi({
      title,
      content: message,
      link: link || window.location.pathname,
    });
    window.dispatchEvent(new CustomEvent(ADMIN_NOTIFICATIONS_CHANGED));
  } catch {
    // Toast already shown; bell sync is best-effort.
  }
};

export const markNotificationReadApi = async (id, client = axiosClient) => {
  const response = await client.patch(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsReadApi = async (client = axiosClient) => {
  const response = await client.patch("/notifications/read-all");
  return response.data;
};
