import Link from "next/link";
import { listUsers } from "@/lib/services/admin.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateUserForm } from "@/components/admin/create-user-form";
import { formatDate } from "@/lib/utils";

export default async function AdminUsersPage() {
  const users = await listUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium text-ink-900">User management</h1>
        <p className="mt-1 text-sm text-ink-500">
          Every account on the docket. Officer, judge, and admin accounts are created here — they
          can&apos;t self-register.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create an officer, judge, or admin account</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateUserForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All accounts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {(users ?? []).map((u) => (
                <tr key={u.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/50">
                  <td className="px-5 py-3">
                    <Link href={`/admin/users/${u.id}`} className="font-medium text-ink-800 hover:underline">
                      {u.full_name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-ink-500">{u.email}</td>
                  <td className="px-5 py-3 font-mono text-xs uppercase text-brass-500">{u.role}</td>
                  <td className="px-5 py-3">
                    <span className={u.is_active ? "text-success-600" : "text-danger-400"}>
                      {u.is_active ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-ink-400">{formatDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
