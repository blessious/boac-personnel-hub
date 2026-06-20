import { api } from "@/lib/api";

export type NotificationRecord = {
  id: string;
  topic: string;
  title: string;
  message: string;
  path: string;
  sourceType: string;
  sourceId: string;
  readAt: string | null;
  createdAt: string;
};

export function listNotifications(limit = 30) {
  return api<{ notifications: NotificationRecord[]; unreadCount: number }>(
    `/api/notifications?limit=${limit}`,
  );
}

export function markNotificationRead(id: string) {
  return api<{ ok: boolean }>(`/api/notifications/${id}/read`, { method: "PATCH" });
}

export function markAllNotificationsRead() {
  return api<{ ok: boolean; updated: number }>("/api/notifications/read-all", {
    method: "POST",
  });
}
