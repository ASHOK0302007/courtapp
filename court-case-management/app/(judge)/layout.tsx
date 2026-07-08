import { requireRole } from "@/lib/auth/require-role";
import { DashboardShell, type NavItem } from "@/components/layout/dashboard-shell";

const NAV_ITEMS: NavItem[] = [
  { href: "/judge/dashboard", label: "Dashboard" },
  { href: "/judge/cases", label: "Assigned cases" },
  { href: "/judge/hearings", label: "Hearing calendar" },
  { href: "/judge/profile", label: "Profile" },
];

export default async function JudgeLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("judge");

  return (
    <DashboardShell
      navItems={NAV_ITEMS}
      roleLabel="Judge"
      userName={session.profile.full_name}
      userId={session.id}
      notificationsHref="/judge/dashboard"
    >
      {children}
    </DashboardShell>
  );
}
