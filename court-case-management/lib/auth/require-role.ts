import { redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "@/lib/auth/get-session";
import type { Database } from "@/lib/types/database.types";

type UserRole = Database["public"]["Enums"]["user_role"];

const ROLE_HOME: Record<UserRole, string> = {
  citizen: "/dashboard",
  court_officer: "/officer/dashboard",
  judge: "/judge/dashboard",
  admin: "/admin/dashboard",
};

/**
 * Server-side guard for use at the top of a role-scoped layout.tsx.
 * Redirects to /login if unauthenticated, or to the caller's own dashboard
 * if authenticated but with the wrong role. This is defense-in-depth on top
 * of the routing already enforced in middleware.ts — RLS on the database
 * remains the actual authorization boundary.
 */
export async function requireRole(...allowed: UserRole[]): Promise<SessionUser> {
  const session = await getSessionUser();

  if (!session) {
    redirect("/login");
  }

  if (!allowed.includes(session.profile.role)) {
    redirect(ROLE_HOME[session.profile.role]);
  }

  return session;
}

/** ApiError: standardized error shape returned by Route Handlers. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
  }

  toResponse() {
    return Response.json(
      { error: { code: this.code, message: this.message, details: this.details } },
      { status: this.status }
    );
  }
}

/**
 * Route Handler variant of the guard — throws ApiError instead of
 * redirecting, so the caller can return a JSON error response.
 */
export async function requireRoleApi(...allowed: UserRole[]): Promise<SessionUser> {
  const session = await getSessionUser();

  if (!session) {
    throw new ApiError(401, "UNAUTHENTICATED", "You must be signed in.");
  }

  if (!allowed.includes(session.profile.role)) {
    throw new ApiError(403, "FORBIDDEN", "You do not have access to this resource.");
  }

  return session;
}
