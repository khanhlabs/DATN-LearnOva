import { useCallback, useEffect, useRef, useState } from "react";
import {
    getMyNotificationsApi,
    getUnreadCountApi,
    markAllNotificationsReadApi,
    markNotificationReadApi,
} from "../api/NotificationApi.js";
import { useAxiosPrivate } from "./UseAxiosPrivate.js";
import { useAuth } from "./UseAuth.jsx";

const POLL_INTERVAL_MS = 45000;

export const useNotifications = () => {
    const axiosClient = useAxiosPrivate();
    const { isAuthenticated } = useAuth();

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const pollRef = useRef(null);

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
            setNotifications(Array.isArray(list) ? list : []);
        } catch {
            setNotifications([]);
        } finally {
            setIsLoading(false);
        }
    }, [axiosClient]);

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

    return {
        notifications,
        unreadCount,
        isLoading,
        loadNotifications,
        markRead,
        markAllRead,
    };
};
