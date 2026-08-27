import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NotificationInboxContent from "../../notification/NotificationInboxContent";
import { getNotificationDestination } from "../../../utils/notificationNavigation";
import { useNotifications } from "../../../hooks/useNotifications";

const NotificationBell = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, loadNotifications, markRead, markAllRead, markSupportConversationRead } = useNotifications();

  const handleClick = async (notification) => {
    const destination = getNotificationDestination(notification, "admin");
    if (!notification.isRead) await markRead(notification.id).catch(() => {});
    if (destination?.conversationId) await markSupportConversationRead(destination.conversationId).catch(() => {});
    if (destination) navigate(destination.path, { state: destination.state });
  };

  return (
    <div className="admin-notification-wrap" onMouseEnter={loadNotifications}>
      <button type="button" aria-label="Notifications" className="admin-topbar__btn">
        <Bell size={20} />
        {unreadCount > 0 && <span className="admin-topbar__badge admin-topbar__badge--red">{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </button>
      <div className="admin-notification-dropdown">
        <NotificationInboxContent
          classPrefix="admin-notification"
          notifications={notifications}
          unreadCount={unreadCount}
          onNotificationClick={handleClick}
          onMarkAllRead={() => markAllRead().catch(() => {})}
        />
      </div>
    </div>
  );
};

export default NotificationBell;
