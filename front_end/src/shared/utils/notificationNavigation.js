const SUPPORT_TYPE = "SUPPORT_MESSAGE";

export const getSupportConversationId = (notification) => {
  const metadataId = notification?.metadata?.conversationId;
  if (metadataId != null) return String(metadataId);

  if (!notification?.link) return null;
  try {
    const url = new URL(notification.link, window.location.origin);
    return url.searchParams.get("supportConversationId") || url.searchParams.get("conversationId");
  } catch {
    return null;
  }
};

export const getNotificationDestination = (notification, role) => {
  if (notification?.type === "INSTRUCTOR_NEW_COURSE" && notification.metadata?.courseId != null) {
    return { path: `/learnova/courses/detail/${encodeURIComponent(notification.metadata.courseId)}` };
  }

  if (notification?.type !== SUPPORT_TYPE) {
    return notification?.link ? { path: notification.link } : null;
  }

  const conversationId = getSupportConversationId(notification);
  if (!conversationId) return notification?.link ? { path: notification.link } : null;

  if (role === "admin") {
    return {
      path: `/learnova/admin/support-chat?conversationId=${encodeURIComponent(conversationId)}`,
      conversationId,
    };
  }

  return {
    path: "/learnova/home",
    conversationId,
    state: { supportConversationId: conversationId, openSupportConversation: true },
  };
};

export const rememberPendingSupportConversation = (conversationId) => {
  if (!conversationId) return;
  try {
    localStorage.setItem("learnova:pending-support-conversation", conversationId);
  } catch {
    // Không để localStorage đầy làm hỏng thao tác mở cuộc trò chuyện.
  }
};
