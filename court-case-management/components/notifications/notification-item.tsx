"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/utils";

interface NotificationItemProps {
  notification: {
    id: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
  };
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const router = useRouter();
  const [isRead, setIsRead] = useState(notification.is_read);

  async function markRead() {
    if (isRead) return;
    setIsRead(true);
    await fetch(`/api/notifications/${notification.id}/read`, { method: "PATCH" });
    router.refresh();
  }

  return (
    <li
      onClick={markRead}
      className={`cursor-pointer px-5 py-4 text-sm ${isRead ? "" : "bg-brass-50/40"}`}
    >
      <div className="flex items-center justify-between">
        <p className="font-medium text-ink-800">{notification.title}</p>
        <p className="font-mono text-xs text-ink-400">{formatDateTime(notification.created_at)}</p>
      </div>
      <p className="mt-1 text-ink-500">{notification.message}</p>
    </li>
  );
}
