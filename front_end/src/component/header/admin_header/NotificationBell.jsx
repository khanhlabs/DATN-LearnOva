import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAxiosPrivate } from "../../../hook/UseAxiosPrivate.js";
import {
  ADMIN_NOTIFICATIONS_CHANGED,
  getMyNotificationsApi,
  getUnreadCountApi,
  markNotificationReadApi,
} from "../../../api/NotificationApi.js";

const timeAgo = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const axiosClient = useAxiosPrivate();
  const [notifications, setNotifications] = useState([]);
  const [badgeCount, setBadgeCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  const refreshBell = async () => {
    try {
      const [list, count] = await Promise.all([
        getMyNotificationsApi(0, 20, axiosClient),
        getUnreadCountApi(axiosClient),
      ]);
      setNotifications(Array.isArray(list) ? list : []);
      setBadgeCount(Number(count) || 0);
    } catch {
      // keep previous state on transient failure
    }
  };

  useEffect(() => {
    void refreshBell();
    const onChanged = () => {
      void refreshBell();
    };
    window.addEventListener(ADMIN_NOTIFICATIONS_CHANGED, onChanged);
    return () => window.removeEventListener(ADMIN_NOTIFICATIONS_CHANGED, onChanged);
  }, [axiosClient]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const toggleOpen = () => {
    if (!isOpen) void refreshBell();
    setIsOpen((prev) => !prev);
  };

  const handleClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await markNotificationReadApi(notification.id, axiosClient);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)),
        );
        setBadgeCount((prev) => Math.max(0, prev - 1));
      } catch {
        // ignore mark-read failure
      }
    }
    setIsOpen(false);
    if (notification.link) navigate(notification.link);
  };

  return (
    <div className="admin-notification-wrap" ref={wrapperRef}>
      <button
        type="button"
        aria-label="Notifications"
        className="admin-topbar__btn"
        onClick={toggleOpen}
      >
        <Bell size={20} />
        {badgeCount > 0 && (
          <span className="admin-topbar__badge admin-topbar__badge--red">
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="admin-notification-dropdown">
          <div className="admin-notification-heading">
            <strong>Notifications</strong>
            <span>{badgeCount} new</span>
          </div>

          <ul className="admin-notification-list">
            {notifications.length === 0 && (
              <li className="admin-notification-empty">No notifications yet.</li>
            )}
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={notification.isRead ? "" : "is-unread"}
                onClick={() => handleClick(notification)}
              >
                <span aria-hidden="true" />
                <div>
                  <strong>{notification.title}</strong>
                  <p>{notification.content}</p>
                  <small>{timeAgo(notification.createdAt)}</small>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
