import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/types/database.types";

const ROLE_HOME: Record<string, string> = {
  citizen: "/dashboard",
  court_officer: "/officer/dashboard",
  judge: "/judge/dashboard",
  admin: "/admin/dashboard",
};

const ROLE_PREFIX: Record<string, string> = {
  citizen: "/", // citizen routes are not prefixed, e.g. /dashboard, /cases
  court_officer: "/officer",
  judge: "/judge",
  admin: "/admin",
};

const PUBLIC_PATHS = ["/", "/login", "/register", "/forgot-password", "/reset-password"];

/**
 * Refreshes the Supabase session cookie on every request and enforces
 * role-based routing. Must run for every request that touches a protected
 * route (configured via the matcher in the root middleware.ts).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.includes(path);

  if (!user && !isPublic) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectTo", path);
    return NextResponse.redirect(redirectUrl);
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    if (profile && !profile.is_active) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/login?deactivated=1", request.url));
    }

    const role = profile?.role ?? "citizen";

    // Signed-in users hitting an auth page get sent to their dashboard.
    if (["/login", "/register", "/forgot-password"].includes(path)) {
      return NextResponse.redirect(new URL(ROLE_HOME[role] ?? "/dashboard", request.url));
    }

    // Enforce that a role only accesses its own prefixed route group.
    for (const [otherRole, prefix] of Object.entries(ROLE_PREFIX)) {
      if (otherRole === role || prefix === "/") continue;
      if (path.startsWith(prefix)) {
        return NextResponse.redirect(new URL(ROLE_HOME[role] ?? "/dashboard", request.url));
      }
    }

    // Citizens are blocked from officer/judge/admin-prefixed paths above;
    // block non-citizens from citizen-only paths too.
    const citizenOnlyPaths = ["/dashboard", "/cases", "/hearings", "/judgments", "/notifications"];
    if (role !== "citizen" && citizenOnlyPaths.some((p) => path === p || path.startsWith(p + "/"))) {
      return NextResponse.redirect(new URL(ROLE_HOME[role] ?? "/dashboard", request.url));
    }
  }

  return response;
}
