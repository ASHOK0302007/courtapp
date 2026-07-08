"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

interface Setting {
  key: string;
  value: unknown;
}

const LABELS: Record<string, string> = {
  case_number_prefix: "Case number prefix",
  max_upload_size_mb: "Max upload size (MB)",
  allow_public_signup: "Allow public citizen signup",
};

export function SettingsForm({ settings }: { settings: Setting[] }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(settings.map((s) => [s.key, String(JSON.parse(JSON.stringify(s.value)))]))
  );
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveOne(key: string) {
    setError(null);
    setSavingKey(key);
    try {
      const raw = values[key];
      let value: unknown = raw;
      if (raw === "true" || raw === "false") value = raw === "true";
      else if (!Number.isNaN(Number(raw)) && raw.trim() !== "") value = Number(raw);

      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Could not save the setting.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div className="space-y-5">
      {settings.map((s) => (
        <div key={s.key} className="flex items-end gap-3">
          <div className="flex-1">
            <Label htmlFor={s.key}>{LABELS[s.key] ?? s.key}</Label>
            <Input
              id={s.key}
              value={values[s.key] ?? ""}
              onChange={(e) => setValues((prev) => ({ ...prev, [s.key]: e.target.value }))}
            />
          </div>
          <Button size="md" variant="outline" onClick={() => saveOne(s.key)} disabled={savingKey !== null}>
            {savingKey === s.key ? "Saving…" : "Save"}
          </Button>
        </div>
      ))}
      {error && <p className="text-sm text-danger-400">{error}</p>}
    </div>
  );
}
