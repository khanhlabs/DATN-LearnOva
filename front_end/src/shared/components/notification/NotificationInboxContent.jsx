const timeAgo = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const NotificationInboxContent = ({
  classPrefix,
  notifications,
  unreadCount,
  onNotificationClick,
  onMarkAllRead,
}) => (
  <>
    <div className={`${classPrefix}-heading`}>
      <strong>Notifications</strong>
      <div className={`${classPrefix}-heading-actions`}>
        <span>{unreadCount} new</span>
        <button
          type="button"
          className={`${classPrefix}-mark-all-read`}
          disabled={unreadCount === 0}
          onClick={onMarkAllRead}
        >
          Mark all read
        </button>
      </div>
    </div>

    <ul className={`${classPrefix}-list`}>
      {notifications.length === 0 && (
        <li className={`${classPrefix}-empty`}>No notifications yet.</li>
      )}
      {notifications.map((notification) => (
        <li
          key={notification.id}
          className={notification.isRead ? "" : "is-unread"}
          onClick={() => onNotificationClick(notification)}
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
  </>
);

export default NotificationInboxContent;
