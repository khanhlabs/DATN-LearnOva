import { useEffect, useRef } from "react";
import { useAuth } from "./useAuth";

const getWebSocketUrl = (token) => {
  const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
  const baseUrl = apiUrl.replace(/\/api\/learnova\/?$/, "");
  const socketUrl = baseUrl.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
  return `${socketUrl}/ws/support?token=${encodeURIComponent(token)}`;
};

export const useSupportRealtime = (onMessage, activeConversationId = null) => {
  const { accessToken, isAuthenticated } = useAuth();
  const callbackRef = useRef(onMessage);
  const socketRef = useRef(null);
  const activeConversationRef = useRef(activeConversationId);

  useEffect(() => {
    callbackRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    activeConversationRef.current = activeConversationId || null;
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "SUPPORT_CONVERSATION_ACTIVE",
        conversationId: activeConversationRef.current,
      }));
    }
  }, [activeConversationId]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return undefined;

    let socket;
    let reconnectTimer;
    let stopped = false;

    const connect = () => {
      if (stopped) return;
      socket = new WebSocket(getWebSocketUrl(accessToken));
      socketRef.current = socket;
      socket.onopen = () => {
        socket.send(JSON.stringify({
          type: "SUPPORT_CONVERSATION_ACTIVE",
          conversationId: activeConversationRef.current,
        }));
      };
      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload?.type === "SUPPORT_MESSAGE") {
            callbackRef.current?.(payload);
            window.dispatchEvent(new CustomEvent("learnova:support-message", { detail: payload }));
          }
        } catch {
          // Ignore malformed realtime events.
        }
      };
      socket.onclose = () => {
        if (socketRef.current === socket) socketRef.current = null;
        if (!stopped) reconnectTimer = window.setTimeout(connect, 2000);
      };
      socket.onerror = () => socket?.close();
    };

    connect();
    return () => {
      stopped = true;
      window.clearTimeout(reconnectTimer);
      if (socketRef.current === socket) socketRef.current = null;
      socket?.close();
    };
  }, [accessToken, isAuthenticated]);
};
