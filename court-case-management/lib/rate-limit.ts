import "server-only";

/**
 * Minimal in-memory sliding-window rate limiter for Route Handlers.
 *
 * This is intentionally simple and has one real limitation: it's per
 * serverless instance, so on Vercel (many concurrent instances) it only
 * bounds abuse per-instance, not globally. That's still useful protection
 * against a single client hammering an endpoint, but for a hard global
 * limit in production, swap this for Upstash Redis + `@upstash/ratelimit`
 * (a few lines — see the comment at the bottom of this file) and point
 * VERCEL_KV / UPSTASH env vars at a shared store.
 */

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

// Periodically evict old buckets so this doesn't grow unbounded across a
// long-lived serverless instance.
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart > SWEEP_INTERVAL_MS) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

/**
 * @param key unique key for the caller + route, e.g. `cases:file:<userId-or-ip>`
 * @param limit max requests allowed per window
 * @param windowMs window length in milliseconds
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart >= windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterMs: windowMs - (now - bucket.windowStart) };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, retryAfterMs: 0 };
}

/** Extracts a best-effort client identifier from a Route Handler request, for unauthenticated endpoints. */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() ?? "unknown";
}

export function rateLimitResponse(result: RateLimitResult) {
  return Response.json(
    { error: { code: "RATE_LIMITED", message: "Too many requests. Please slow down." } },
    { status: 429, headers: { "Retry-After": Math.ceil(result.retryAfterMs / 1000).toString() } }
  );
}

/**
 * Production upgrade path (Upstash Redis, works across all Vercel instances):
 *
 *   import { Ratelimit } from "@upstash/ratelimit";
 *   import { Redis } from "@upstash/redis";
 *   const ratelimit = new Ratelimit({
 *     redis: Redis.fromEnv(),
 *     limiter: Ratelimit.slidingWindow(10, "1 m"),
 *   });
 *   const { success } = await ratelimit.limit(key);
 *
 * Swap the body of checkRateLimit() for this and the call sites below don't
 * need to change.
 */
