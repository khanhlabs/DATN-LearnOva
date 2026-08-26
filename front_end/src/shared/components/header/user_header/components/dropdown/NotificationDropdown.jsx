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

const getSupportConversationId = (notification) => {
  const metadataId = notification?.metadata?.conversationId;
  if (metadataId != null) return String(metadataId);

  if (!notification?.link) return null;
  try {
    const url = new URL(notification.link, window.location.origin);
    return url.searchParams.get("supportConversationId")
      || url.searchParams.get("conversationId");
  } catch {
    return null;
  }
};

const savePendingConversation = (conversationId) => {
  try {
    localStorage.setItem("learnova:pending-support-conversation", conversationId);
  } catch {
    // Không để localStorage đầy làm hỏng thao tác mở cuộc trò chuyện.
  }
};

const NotificationDropdown = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, loadNotifications, markRead, deleteNotification, clearSupportConversationNotifications } = useNotifications();

  const handleClick = async (notification) => {
    const conversationId = notification.type === "SUPPORT_MESSAGE"
      ? getSupportConversationId(notification)
      : null;
    const targetLink = conversationId
      ? `/learnova/home?supportConversationId=${encodeURIComponent(conversationId)}`
      : notification.link;

    if (conversationId) {
      savePendingConversation(conversationId);
    }
    if (targetLink) {
      if (conversationId) {
        navigate("/learnova/home", {
          state: { supportConversationId: conversationId, openSupportConversation: true },
        });
      } else {
        navigate(targetLink);
      }
    }

    if (!notification.isRead) markRead(notification.id).catch(() => {});
    if (conversationId) {
      clearSupportConversationNotifications(conversationId).catch(() => {});
    } else {
      deleteNotification(notification.id).catch(() => {});
    }
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
