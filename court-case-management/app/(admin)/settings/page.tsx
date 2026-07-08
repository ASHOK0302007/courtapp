import { getSystemSettings } from "@/lib/services/admin.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function AdminSettingsPage() {
  const settings = await getSystemSettings();

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-2xl font-medium text-ink-900">System settings</h1>
      <p className="mt-1 text-sm text-ink-500">Configuration used across the whole docket.</p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm settings={settings ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
