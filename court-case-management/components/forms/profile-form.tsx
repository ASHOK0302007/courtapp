"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

interface ProfileFormProps {
  profile: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    role: string;
    bar_or_badge_id: string | null;
  };
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(profile.full_name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);

  async function saveProfile() {
    setProfileError(null);
    setProfileSaved(false);
    setSavingProfile(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, phone: phone || null })
        .eq("id", profile.id);
      if (error) throw new Error(error.message);
      setProfileSaved(true);
      router.refresh();
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword() {
    setPasswordError(null);
    setPasswordSaved(false);
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    setSavingPassword(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw new Error(error.message);
      setNewPassword("");
      setPasswordSaved(true);
    } catch (e) {
      setPasswordError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div>
          <Label>Email</Label>
          <p className="text-sm text-ink-700">{profile.email}</p>
        </div>
        <div>
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        {profile.bar_or_badge_id && (
          <div>
            <Label>Bar / badge ID</Label>
            <p className="text-sm text-ink-700">{profile.bar_or_badge_id}</p>
          </div>
        )}
        {profileError && <p className="text-sm text-danger-400">{profileError}</p>}
        {profileSaved && <p className="text-sm text-success-600">Profile updated.</p>}
        <Button onClick={saveProfile} disabled={savingProfile}>
          {savingProfile ? "Saving…" : "Save profile"}
        </Button>
      </div>

      <div className="space-y-4 border-t border-ink-100 pt-6">
        <div>
          <Label htmlFor="newPassword">New password</Label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        {passwordError && <p className="text-sm text-danger-400">{passwordError}</p>}
        {passwordSaved && <p className="text-sm text-success-600">Password changed.</p>}
        <Button variant="outline" onClick={changePassword} disabled={savingPassword}>
          {savingPassword ? "Saving…" : "Change password"}
        </Button>
      </div>
    </div>
  );
}
