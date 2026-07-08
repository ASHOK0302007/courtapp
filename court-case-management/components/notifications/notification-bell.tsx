"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface NotificationRow {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function NotificationBell({ userId, notificationsHref }: { userId: string; notificationsHref: string }) {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase
      .from("notifications")
      .select("id, title, message, is_read, created_at")
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) setNotifications(data);
      });

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${userId}` },
        (payload) => {
          setNotifications((prev) => [payload.new as NotificationRow, ...prev].slice(0, 10));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-500 hover:bg-ink-50 hover:text-ink-900"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger-400 font-mono text-[10px] text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-80 rounded-lg border border-ink-100 bg-white shadow-lg">
          <div className="border-b border-ink-100 px-4 py-3">
            <p className="font-display text-sm font-medium text-ink-900">Notifications</p>
          </div>
          <ul className="max-h-80 divide-y divide-ink-50 overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="px-4 py-4 text-sm text-ink-500">Nothing yet.</li>
            ) : (
              notifications.map((n) => (
                <li key={n.id} className={`px-4 py-3 text-sm ${n.is_read ? "" : "bg-brass-50/40"}`}>
                  <p className="font-medium text-ink-800">{n.title}</p>
                  <p className="text-ink-500">{n.message}</p>
                </li>
              ))
            )}
          </ul>
          <div className="border-t border-ink-100 px-4 py-2">
            <Link
              href={notificationsHref}
              className="text-xs font-medium text-brass-500 hover:underline"
              onClick={() => setOpen(false)}
            >
              View all
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
