import { listNotifications } from "@/lib/services/notifications.service";
import { Card, CardContent } from "@/components/ui/card";
import { NotificationItem } from "@/components/notifications/notification-item";

export default async function NotificationsPage() {
  const notifications = await listNotifications();

  return (
    <div>
      <h1 className="font-display text-2xl font-medium text-ink-900">Notifications</h1>
      <p className="mt-1 text-sm text-ink-500">Case updates, hearing changes, and published judgments.</p>

      <Card className="mt-6">
        <CardContent className="p-0">
          {!notifications || notifications.length === 0 ? (
            <p className="p-5 text-sm text-ink-500">Nothing here yet.</p>
          ) : (
            <ul className="divide-y divide-ink-50">
              {notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
