import Link from "next/link";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { NotificationBell } from "@/components/notifications/notification-bell";

export interface NavItem {
  href: string;
  label: string;
}

export function DashboardShell({
  navItems,
  roleLabel,
  userName,
  userId,
  notificationsHref,
  children,
}: {
  navItems: NavItem[];
  roleLabel: string;
  userName: string;
  userId: string;
  notificationsHref: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="flex w-60 flex-shrink-0 flex-col border-r border-ink-100 bg-white">
        <Link href="/" className="flex items-center gap-2 border-b border-ink-100 px-5 py-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-sm border-2 border-ink-800 font-display text-xs font-semibold text-ink-800">
            D
          </div>
          <span className="font-display text-base font-medium text-ink-900">Docket</span>
        </Link>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded px-3 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50 hover:text-ink-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-ink-100 px-5 py-4">
          <p className="truncate text-sm font-medium text-ink-800">{userName}</p>
          <p className="font-mono text-xs uppercase tracking-wide text-brass-500">{roleLabel}</p>
          <SignOutButton />
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-end border-b border-ink-100 bg-white px-6 py-3">
          <NotificationBell userId={userId} notificationsHref={notificationsHref} />
        </header>
        <main className="flex-1 overflow-y-auto px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
