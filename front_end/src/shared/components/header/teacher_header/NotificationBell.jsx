import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NotificationInboxContent from "../../notification/NotificationInboxContent";
import { getNotificationDestination } from "../../../utils/notificationNavigation";
import { useNotifications } from "../../../hooks/useNotifications";

const NotificationBell = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, loadNotifications, markRead, markAllRead, markSupportConversationRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const toggleOpen = () => {
    if (!isOpen) loadNotifications();
    setIsOpen((previous) => !previous);
  };

  const handleClick = async (notification) => {
    const destination = getNotificationDestination(notification, "teacher");
    if (!notification.isRead) await markRead(notification.id).catch(() => {});
    if (destination?.conversationId) await markSupportConversationRead(destination.conversationId).catch(() => {});
    setIsOpen(false);
    if (destination) navigate(destination.path, { state: destination.state });
  };

  return (
    <div className="teacher-notification-wrap" ref={wrapperRef}>
      <button type="button" aria-label="Notifications" className="teacher-topbar__btn" onClick={toggleOpen}>
        <Bell size={20} />
        {unreadCount > 0 && <span className="teacher-topbar__badge teacher-topbar__badge--red">{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </button>
      {isOpen && (
        <div className="teacher-notification-dropdown">
          <NotificationInboxContent
            classPrefix="teacher-notification"
            notifications={notifications}
            unreadCount={unreadCount}
            onNotificationClick={handleClick}
            onMarkAllRead={() => markAllRead().catch(() => {})}
          />
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
