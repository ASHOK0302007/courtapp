import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditUserForm } from "@/components/admin/edit-user-form";

export default async function EditUserPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const supabase = createAdminClient();

  const { data: user } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (!user) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-2xl font-medium text-ink-900">{user.full_name}</h1>
      <p className="mt-1 text-sm text-ink-500">Manage this account&apos;s role and status.</p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Account settings</CardTitle>
        </CardHeader>
        <CardContent>
          <EditUserForm user={user} />
        </CardContent>
      </Card>
    </div>
  );
}
