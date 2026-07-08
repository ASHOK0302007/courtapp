"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth.schema";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  // The recovery link Supabase emails signs the user in with a temporary
  // session automatically (handled by the Supabase client reading the URL
  // fragment on load), so this page just needs to call updateUser().
  async function onSubmit(values: ResetPasswordInput) {
    setFormError(null);
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({ password: values.password });

    setLoading(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    router.push("/login");
  }

  return (
    <>
      <h1 className="font-display text-xl font-medium text-ink-900">Choose a new password</h1>
      <p className="mt-1 text-sm text-ink-500">Enter a new password for your account.</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <Label htmlFor="password">New password</Label>
          <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
          <FieldError>{errors.password?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input id="confirmPassword" type="password" autoComplete="new-password" {...register("confirmPassword")} />
          <FieldError>{errors.confirmPassword?.message}</FieldError>
        </div>

        {formError && <p className="text-sm text-danger-400">{formError}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Saving…" : "Save new password"}
        </Button>
      </form>
    </>
  );
}
