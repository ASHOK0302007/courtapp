import { requireRoleApi, ApiError } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    await requireRoleApi("admin");
    const supabase = createAdminClient();

    const [{ count: totalCases }, { count: totalUsers }, { data: statusRows }, { data: roleRows }] = await Promise.all([
      supabase.from("cases").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("cases").select("status"),
      supabase.from("profiles").select("role"),
    ]);

    const casesByStatus = (statusRows ?? []).reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = (acc[row.status] ?? 0) + 1;
      return acc;
    }, {});

    const usersByRole = (roleRows ?? []).reduce<Record<string, number>>((acc, row) => {
      acc[row.role] = (acc[row.role] ?? 0) + 1;
      return acc;
    }, {});

    return Response.json({
      data: { totalCases: totalCases ?? 0, totalUsers: totalUsers ?? 0, casesByStatus, usersByRole },
    });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    return Response.json({ error: { code: "INTERNAL", message: "Unexpected error." } }, { status: 500 });
  }
}
