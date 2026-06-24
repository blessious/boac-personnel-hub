/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationRecord,
} from "@/lib/notifications-api";

export type RealtimeEvent = {
  id: string;
  kind: "refresh" | "notification";
  topic: string;
  title: string;
  message: string;
  path: string;
  sourceType: string;
  sourceId: string;
  readAt: string | null;
  createdAt: string;
};

type RealtimeContextValue = {
  connected: boolean;
  notifications: NotificationRecord[];
  unreadCount: number;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const RealtimeContext = createContext<RealtimeContextValue>({
  connected: false,
  notifications: [],
  unreadCount: 0,
  markRead: async () => undefined,
  markAllRead: async () => undefined,
});

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const invalidateTimer = useRef<number | null>(null);
  const knownNotificationIds = useRef(new Set<string>());

  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const result = await listNotifications(30);
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
      knownNotificationIds.current = new Set(result.notifications.map((item) => item.id));
    } catch {
      // The realtime connection can recover this list after a reconnect.
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      knownNotificationIds.current.clear();
      return;
    }
    refreshNotifications();
  }, [refreshNotifications, user]);

  useEffect(() => {
    if (!user || typeof window === "undefined") {
      setConnected(false);
      return;
    }

    const source = new EventSource("/api/realtime/events", { withCredentials: true });
    let hasConnected = false;
    source.addEventListener("connected", () => {
      setConnected(true);
      if (hasConnected) {
        refreshNotifications();
        queryClient.invalidateQueries({ refetchType: "active" });
        window.dispatchEvent(
          new CustomEvent("hris:realtime", {
            detail: { topic: "system", kind: "refresh" } as RealtimeEvent,
          }),
        );
      }
      hasConnected = true;
    });
    source.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as RealtimeEvent;
        window.dispatchEvent(new CustomEvent("hris:realtime", { detail: event }));
        if (invalidateTimer.current !== null) window.clearTimeout(invalidateTimer.current);
        invalidateTimer.current = window.setTimeout(() => {
          queryClient.invalidateQueries({ refetchType: "active" });
        }, 180);
        if (event.kind === "notification") {
          if (!knownNotificationIds.current.has(event.id)) {
            knownNotificationIds.current.add(event.id);
            setUnreadCount((current) => current + 1);
          }
          setNotifications((current) =>
            [event, ...current.filter((item) => item.id !== event.id)].slice(0, 30),
          );
          toast.info(event.title, { description: event.message });
        }
      } catch {
        // Ignore malformed events; EventSource will continue receiving later updates.
      }
    };
    source.onerror = () => setConnected(false);

    return () => {
      source.close();
      if (invalidateTimer.current !== null) window.clearTimeout(invalidateTimer.current);
      setConnected(false);
    };
  }, [queryClient, refreshNotifications, user]);

  return (
    <RealtimeContext.Provider
      value={{
        connected,
        notifications,
        unreadCount,
        markRead: async (id) => {
          const target = notifications.find((item) => item.id === id);
          if (!target || target.readAt) return;
          const readAt = new Date().toISOString();
          setNotifications((current) =>
            current.map((item) => (item.id === id ? { ...item, readAt } : item)),
          );
          setUnreadCount((current) => Math.max(0, current - 1));
          try {
            await markNotificationRead(id);
          } catch {
            await refreshNotifications();
          }
        },
        markAllRead: async () => {
          const readAt = new Date().toISOString();
          setNotifications((current) => current.map((item) => ({ ...item, readAt })));
          setUnreadCount(0);
          try {
            await markAllNotificationsRead();
          } catch {
            await refreshNotifications();
          }
        },
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  return useContext(RealtimeContext);
}

export function useRealtimeRefresh(refresh: () => void, topics?: string[]) {
  const refreshRef = useRef(refresh);
  const topicsRef = useRef(topics);
  const timerRef = useRef<number | null>(null);
  refreshRef.current = refresh;
  topicsRef.current = topics;

  useEffect(() => {
    const handleEvent = (rawEvent: Event) => {
      const event = (rawEvent as CustomEvent<RealtimeEvent>).detail;
      if (
        topicsRef.current?.length &&
        !topicsRef.current.includes(event.topic) &&
        event.topic !== "system"
      )
        return;
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => refreshRef.current(), 180);
    };
    window.addEventListener("hris:realtime", handleEvent);
    return () => {
      window.removeEventListener("hris:realtime", handleEvent);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);
}
