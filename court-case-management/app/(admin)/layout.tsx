import { requireRole } from "@/lib/auth/require-role";
import { DashboardShell, type NavItem } from "@/components/layout/dashboard-shell";

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/dashboard", label: "Analytics" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/cases", label: "All cases" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/profile", label: "Profile" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("admin");

  return (
    <DashboardShell
      navItems={NAV_ITEMS}
      roleLabel="Admin"
      userName={session.profile.full_name}
      userId={session.id}
      notificationsHref="/admin/dashboard"
    >
      {children}
    </DashboardShell>
  );
}
