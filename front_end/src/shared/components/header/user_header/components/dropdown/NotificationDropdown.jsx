import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NotificationInboxContent from "../../../../../components/notification/NotificationInboxContent";
import {
  getNotificationDestination,
  rememberPendingSupportConversation,
} from "../../../../../utils/notificationNavigation";
import HeaderDropdown from "./HeaderDropdown";
import { useNotifications } from "../../../../../hooks/useNotifications";

const NotificationDropdown = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, loadNotifications, markRead, markAllRead, markSupportConversationRead } = useNotifications();

  const handleClick = async (notification) => {
    const destination = getNotificationDestination(notification, "user");
    if (!notification.isRead) await markRead(notification.id).catch(() => {});
    if (destination?.conversationId) {
      await markSupportConversationRead(destination.conversationId).catch(() => {});
      rememberPendingSupportConversation(destination.conversationId);
    }
    if (destination) navigate(destination.path, { state: destination.state });
  };

  return (
    <div className="user-logged-icon-menu" onMouseEnter={loadNotifications}>
      <button type="button" className="user-logged-icon-button" aria-label="Open notifications">
        <Bell size={21} />
        {unreadCount > 0 && <span className="user-logged-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </button>
      <HeaderDropdown align="right" className="user-logged-notification-dropdown">
        <NotificationInboxContent
          classPrefix="user-logged-notification"
          notifications={notifications}
          unreadCount={unreadCount}
          onNotificationClick={handleClick}
          onMarkAllRead={() => markAllRead().catch(() => {})}
        />
      </HeaderDropdown>
    </div>
  );
};

export default NotificationDropdown;
