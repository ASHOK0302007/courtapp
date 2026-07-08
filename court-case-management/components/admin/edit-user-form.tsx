"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const ROLES = [
  { value: "citizen", label: "Citizen" },
  { value: "court_officer", label: "Court officer" },
  { value: "judge", label: "Judge" },
  { value: "admin", label: "Admin" },
] as const;

interface EditUserFormProps {
  user: {
    id: string;
    full_name: string;
    email: string;
    role: string;
    bar_or_badge_id: string | null;
    is_active: boolean;
  };
}

export function EditUserForm({ user }: EditUserFormProps) {
  const router = useRouter();
  const [role, setRole] = useState(user.role);
  const [badgeId, setBadgeId] = useState(user.bar_or_badge_id ?? "");
  const [isActive, setIsActive] = useState(user.is_active);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, barOrBadgeId: badgeId, isActive }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Could not update the account.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Email</Label>
        <p className="text-sm text-ink-700">{user.email}</p>
      </div>

      <div>
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="flex h-10 w-full rounded border border-ink-200 bg-white px-3 text-sm text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-800"
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="badgeId">Bar / badge ID</Label>
        <Input id="badgeId" value={badgeId} onChange={(e) => setBadgeId(e.target.value)} />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="isActive"
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 rounded border-ink-300"
        />
        <Label htmlFor="isActive" className="mb-0">
          Account active
        </Label>
      </div>

      {error && <p className="text-sm text-danger-400">{error}</p>}

      <Button onClick={save} disabled={loading}>
        {loading ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}
