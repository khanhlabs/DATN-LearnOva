import { useCallback, useEffect, useRef, useState } from "react";
import {
    getMyNotificationsApi,
    getUnreadCountApi,
    markAllNotificationsReadApi,
    markNotificationReadApi,
    deleteSupportConversationNotificationsApi,
    deleteNotificationApi,
} from "../../features/notification/infrastructure/api/NotificationApi";
import { useAxiosPrivate } from "./useAxiosPrivate";
import { useAuth } from "./useAuth";


const POLL_INTERVAL_MS = 45000;
const PLAYED_NOTIFICATION_KEY = "learnova:played-notification-ids";

const wasNotificationSoundPlayed = (notificationId) => {
    if (notificationId == null) return true;
    try {
        const ids = JSON.parse(sessionStorage.getItem(PLAYED_NOTIFICATION_KEY) || "[]");
        return ids.includes(String(notificationId));
    } catch {
        return false;
    }
};

const rememberNotificationSound = (notificationId) => {
    if (notificationId == null) return;
    try {
        const ids = JSON.parse(sessionStorage.getItem(PLAYED_NOTIFICATION_KEY) || "[]");
        const nextIds = [...new Set([...ids, String(notificationId)])].slice(-100);
        sessionStorage.setItem(PLAYED_NOTIFICATION_KEY, JSON.stringify(nextIds));
    } catch {
        // Không để lỗi bộ nhớ trình duyệt ảnh hưởng thông báo.
    }
};


export const useNotifications = () => {
    const axiosClient = useAxiosPrivate();
    const { isAuthenticated, currentUser } = useAuth();
    const isAdmin = currentUser?.roles?.includes("ROLE_ADMIN") || currentUser?.activeRole === "ROLE_ADMIN";

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const pollRef = useRef(null);
    const previousUnreadRef = useRef(null);
    const supportEventNotifiedRef = useRef(false);

    const refreshUnreadCount = useCallback(async () => {
        try {
            const count = await getUnreadCountApi(axiosClient);
            setUnreadCount(count);
        } catch {
            // ignore transient polling failures
        }
    }, [axiosClient]);

    const loadNotifications = useCallback(async () => {
        setIsLoading(true);
        try {
            const list = await getMyNotificationsApi(0, 20, axiosClient);
            const nextNotifications = Array.isArray(list) ? list : [];
            setNotifications(nextNotifications);
            return nextNotifications;
        } catch {
            setNotifications([]);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [axiosClient]);

    const notifyNewNotification = useCallback(async ({ skipLoad = false } = {}) => {
        const latestNotifications = skipLoad ? [] : await loadNotifications();
        const latest = latestNotifications.find((notification) => !notification.isRead)
            || latestNotifications[0];
        const shouldPlaySound = latest?.type === "SUPPORT_MESSAGE"
            && !wasNotificationSoundPlayed(latest.id);
        if (shouldPlaySound) rememberNotificationSound(latest.id);

        if (shouldPlaySound) try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                const audioContext = new AudioContextClass();
                const tones = isAdmin ? [440, 660] : [880];
                tones.forEach((frequency, index) => {
                    const startAt = audioContext.currentTime + index * 0.12;
                    const oscillator = audioContext.createOscillator();
                    const gain = audioContext.createGain();
                    oscillator.frequency.value = frequency;
                    oscillator.type = isAdmin ? "square" : "sine";
                    gain.gain.setValueAtTime(0.08, startAt);
                    gain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.16);
                    oscillator.connect(gain);
                    gain.connect(audioContext.destination);
                    oscillator.start(startAt);
                    oscillator.stop(startAt + 0.16);
                });
            }
        } catch {
            // Browser may block audio until the user interacts with the page.
        }

        if (!skipLoad && document.hidden && "Notification" in window && latest) {
            if (Notification.permission === "default") {
                await Notification.requestPermission();
            }
            if (Notification.permission === "granted") {
                const browserNotification = new Notification(latest.title || "LearnOva", {
                    body: latest.content || "Bạn có thông báo mới.",
                    tag: `learnova-notification-${latest.id}`,
                });
                browserNotification.onclick = () => {
                    window.focus();

                    if (latest.type === "SUPPORT_MESSAGE" && latest.link) {
                        const url = new URL(latest.link, window.location.origin);
                        const conversationId = url.searchParams.get("supportConversationId")
                            || url.searchParams.get("conversationId");
                        if (conversationId) {
                            try {
                                localStorage.setItem("learnova:pending-support-conversation", conversationId);
                            } catch {
                                // Không để localStorage đầy chặn việc mở chat.
                            }
                        }
                    }

                    if (latest.link) {
                        window.location.assign(latest.link);
                    }
                    browserNotification.close();
                };
            }
        }
    }, [isAdmin, loadNotifications]);

    const markRead = useCallback(async (id) => {
        await markNotificationReadApi(id, axiosClient);
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
    }, [axiosClient]);

    const markAllRead = useCallback(async () => {
        await markAllNotificationsReadApi(axiosClient);
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
    }, [axiosClient]);

    const deleteNotification = useCallback(async (id) => {
        await deleteNotificationApi(id, axiosClient);
        setNotifications((prev) => prev.filter((notification) => notification.id !== id));
        await refreshUnreadCount();
    }, [axiosClient, refreshUnreadCount]);

    const clearSupportConversationNotifications = useCallback(async (conversationId) => {
        await deleteSupportConversationNotificationsApi(conversationId, axiosClient);
        setNotifications((prev) => prev.filter((notification) => {
            if (notification.type !== "SUPPORT_MESSAGE" || !notification.link) return true;
            const url = new URL(notification.link, window.location.origin);
            const linkedConversationId = url.searchParams.get("supportConversationId")
                || url.searchParams.get("conversationId");
            return String(linkedConversationId) !== String(conversationId);
        }));
        await refreshUnreadCount();
    }, [axiosClient, refreshUnreadCount]);

    useEffect(() => {
        if (!isAuthenticated) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        refreshUnreadCount();
        pollRef.current = setInterval(refreshUnreadCount, POLL_INTERVAL_MS);

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [isAuthenticated, refreshUnreadCount]);

    useEffect(() => {
        if (!isAuthenticated) {
            previousUnreadRef.current = null;
            return;
        }

        if (previousUnreadRef.current === null) {
            previousUnreadRef.current = unreadCount;
            return;
        }

        if (unreadCount > previousUnreadRef.current) {
            if (supportEventNotifiedRef.current) {
                supportEventNotifiedRef.current = false;
            } else {
                notifyNewNotification().catch(() => {});
            }
        }
        previousUnreadRef.current = unreadCount;
    }, [isAuthenticated, unreadCount, notifyNewNotification]);

    useEffect(() => {
        if (!isAuthenticated) return undefined;
        const handleSupportMessage = (event) => {
            supportEventNotifiedRef.current = true;
            const activeConversationId = window.__learnovaActiveSupportConversationId;
            const incomingConversationId = event?.detail?.conversationId;
            if (activeConversationId && String(activeConversationId) === String(incomingConversationId)) {
                setUnreadCount(0);
                notifyNewNotification({ skipLoad: true }).catch(() => {});
                return;
            }
            notifyNewNotification().catch(() => {});
        };
        window.addEventListener("learnova:support-message", handleSupportMessage);
        return () => window.removeEventListener("learnova:support-message", handleSupportMessage);
    }, [isAuthenticated, notifyNewNotification, refreshUnreadCount]);

    useEffect(() => {
        if (!isAuthenticated) return undefined;
        const handleConversationActive = (event) => {
            if (event?.detail?.conversationId) {
                previousUnreadRef.current = 0;
                setUnreadCount(0);
            } else {
                refreshUnreadCount().catch(() => {});
            }
        };
        window.addEventListener("learnova:support-conversation-active", handleConversationActive);
        return () => window.removeEventListener("learnova:support-conversation-active", handleConversationActive);
    }, [isAuthenticated, refreshUnreadCount]);

    return {
        notifications,
        unreadCount,
        isLoading,
        loadNotifications,
        markRead,
        markAllRead,
        deleteNotification,
        clearSupportConversationNotifications,
    };
};
