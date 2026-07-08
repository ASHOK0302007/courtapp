"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { createUserSchema, type CreateUserInput } from "@/lib/validations/admin.schema";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";

const ROLES = [
  { value: "court_officer", label: "Court officer" },
  { value: "judge", label: "Judge" },
  { value: "admin", label: "Admin" },
] as const;

export function CreateUserForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: "court_officer" },
  });

  async function onSubmit(values: CreateUserInput) {
    setFormError(null);
    setSuccess(false);
    setLoading(true);

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setFormError(json.error?.message ?? "Could not create the account.");
      return;
    }

    setSuccess(true);
    reset({ role: values.role });
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" {...register("fullName")} />
          <FieldError>{errors.fullName?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} />
          <FieldError>{errors.email?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="role">Role</Label>
          <select
            id="role"
            className="flex h-10 w-full rounded border border-ink-200 bg-white px-3 text-sm text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-800"
            {...register("role")}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <FieldError>{errors.role?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="barOrBadgeId">Bar / badge ID (optional)</Label>
          <Input id="barOrBadgeId" {...register("barOrBadgeId")} />
          <FieldError>{errors.barOrBadgeId?.message}</FieldError>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="temporaryPassword">Temporary password</Label>
          <Input id="temporaryPassword" type="text" {...register("temporaryPassword")} />
          <p className="mt-1 text-xs text-ink-400">Share this with the user; they should change it after signing in.</p>
          <FieldError>{errors.temporaryPassword?.message}</FieldError>
        </div>
      </div>

      {formError && <p className="text-sm text-danger-400">{formError}</p>}
      {success && <p className="text-sm text-success-600">Account created.</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Creating…" : "Create account"}
      </Button>
    </form>
  );
}
