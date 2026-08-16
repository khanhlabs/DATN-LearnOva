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
  const { notifications, unreadCount, loadNotifications, markRead, clearSupportConversationNotifications } = useNotifications();

  const handleClick = async (notification) => {
    if (!notification.isRead) {
      await markRead(notification.id).catch(() => null);
    }
    if (notification.type === "SUPPORT_MESSAGE" && notification.link) {
      const url = new URL(notification.link, window.location.origin);
      const conversationId = url.searchParams.get("conversationId");
      if (conversationId) await clearSupportConversationNotifications(conversationId).catch(() => {});
    }
    if (notification.link) navigate(notification.link);
  };

  return (
    <div className="admin-notification-wrap" onMouseEnter={loadNotifications}>
      <button type="button" aria-label="Notifications" className="admin-topbar__btn">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="admin-topbar__badge admin-topbar__badge--red">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <div className="admin-notification-dropdown">
        <div className="admin-notification-heading">
          <strong>Notifications</strong>
          <span>{unreadCount} new</span>
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
    </div>
  );
};

export default NotificationBell;
