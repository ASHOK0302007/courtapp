import { requireRole } from "@/lib/auth/require-role";
import { DashboardShell, type NavItem } from "@/components/layout/dashboard-shell";

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/cases", label: "My cases" },
  { href: "/cases/new", label: "File an appeal" },
  { href: "/hearings", label: "Hearings" },
  { href: "/notifications", label: "Notifications" },
  { href: "/profile", label: "Profile" },
];

export default async function CitizenLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("citizen");

  return (
    <DashboardShell
      navItems={NAV_ITEMS}
      roleLabel="Citizen"
      userName={session.profile.full_name}
      userId={session.id}
      notificationsHref="/notifications"
    >
      {children}
    </DashboardShell>
  );
}
