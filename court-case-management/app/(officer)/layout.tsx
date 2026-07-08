import { requireRole } from "@/lib/auth/require-role";
import { DashboardShell, type NavItem } from "@/components/layout/dashboard-shell";

const NAV_ITEMS: NavItem[] = [
  { href: "/officer/dashboard", label: "Dashboard" },
  { href: "/officer/cases", label: "Case queue" },
  { href: "/officer/hearings", label: "Hearing calendar" },
  { href: "/officer/profile", label: "Profile" },
];

export default async function OfficerLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("court_officer");

  return (
    <DashboardShell
      navItems={NAV_ITEMS}
      roleLabel="Court officer"
      userName={session.profile.full_name}
      userId={session.id}
      notificationsHref="/officer/dashboard"
    >
      {children}
    </DashboardShell>
  );
}
