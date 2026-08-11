import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../../hooks/useNotifications";

const timeAgo = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, loadNotifications, markRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

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
    if (!isOpen) loadNotifications();
    setIsOpen((prev) => !prev);
  };

  const handleClick = async (notification) => {
    if (!notification.isRead) await markRead(notification.id);
    setIsOpen(false);
    if (notification.link) navigate(notification.link);
  };

  return (
    <div className="teacher-notification-wrap" ref={wrapperRef}>
      <button
        type="button"
        aria-label="Notifications"
        className="teacher-topbar__btn"
        onClick={toggleOpen}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="teacher-topbar__badge teacher-topbar__badge--red">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="teacher-notification-dropdown">
          <div className="teacher-notification-heading">
            <strong>Notifications</strong>
            <span>{unreadCount} new</span>
          </div>

          <ul className="teacher-notification-list">
            {notifications.length === 0 && (
              <li className="teacher-notification-empty">No notifications yet.</li>
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
