import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

/**
 * Service-role Supabase client. BYPASSES Row Level Security entirely.
 *
 * Server-only (the `server-only` import throws a build error if this is
 * ever imported from client code). Use ONLY for operations that
 * legitimately require elevated privilege and are already gated by an
 * explicit role check in the calling Route Handler, e.g.:
 *   - Admin creating an officer/judge/admin account
 *   - Generating signed URLs for document downloads
 *   - Database webhook handlers
 *
 * Never use this client to skip writing a proper RLS policy.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
