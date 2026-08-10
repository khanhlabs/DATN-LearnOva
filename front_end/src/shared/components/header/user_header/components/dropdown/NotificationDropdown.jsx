import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import HeaderDropdown from "./HeaderDropdown";
import { useNotifications } from "../../../../../hooks/useNotifications";

const timeAgo = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const NotificationDropdown = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, loadNotifications, markRead } = useNotifications();

  const handleClick = async (notification) => {
    if (!notification.isRead) await markRead(notification.id);
    if (notification.link) navigate(notification.link);
  };

  return (
    <div className="user-logged-icon-menu" onMouseEnter={loadNotifications}>
      <button type="button" className="user-logged-icon-button" aria-label="Open notifications">
        <Bell size={21} />
        {unreadCount > 0 && (
          <span className="user-logged-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      <HeaderDropdown align="right" className="user-logged-notification-dropdown">
        <div className="user-logged-dropdown-heading">
          <strong>Notifications</strong>
          <span>{unreadCount} new</span>
        </div>

        <ul className="user-logged-notification-list">
          {notifications.length === 0 && (
            <li className="user-logged-notification-empty">No notifications yet.</li>
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
      </HeaderDropdown>
    </div>
  );
};

export default NotificationDropdown;
