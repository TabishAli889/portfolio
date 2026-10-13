import 'server-only'

/**
 * Minimal fixed-window rate limiter backed by an in-memory Map.
 *
 * Trade-off, deliberately chosen: on Vercel each serverless instance has its
 * own memory, so a determined attacker spread across instances gets more
 * attempts than the nominal limit. For a personal site this is the right
 * trade — it costs nothing, adds no external dependency, and stops the real
 * threats (a script hammering one endpoint, accidental double submits).
 * If this ever needs to be airtight, swap the two Map operations below for
 * Upstash Redis (`@upstash/ratelimit`); the call sites do not change.
 */

type Bucket = { count: number; resetAt: number }

const globalForRateLimit = globalThis as typeof globalThis & {
  _rateLimitBuckets?: Map<string, Bucket>
}

const buckets: Map<string, Bucket> = (globalForRateLimit._rateLimitBuckets ??= new Map())

export type RateLimitResult = {
  success: boolean
  remaining: number
  /** Seconds until the window resets. */
  retryAfter: number
}

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now()

  // Opportunistic sweep so the Map cannot grow without bound in a long-lived
  // container. Cheap because it only runs when the map is non-trivial.
  if (buckets.size > 500) {
    for (const [k, v] of buckets) {
      if (v.resetAt <= now) buckets.delete(k)
    }
  }

  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: limit - 1, retryAfter: 0 }
  }

  bucket.count += 1
  const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))

  if (bucket.count > limit) {
    return { success: false, remaining: 0, retryAfter }
  }

  return { success: true, remaining: limit - bucket.count, retryAfter }
}

/** Clears a bucket, e.g. after a successful login. */
export function resetRateLimit(key: string): void {
  buckets.delete(key)
}

/**
 * Best-effort client IP. Vercel sets `x-forwarded-for`; the left-most entry is
 * the original client. Falls back to a constant so a missing header degrades
 * to a shared bucket rather than disabling the limiter entirely.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]!.trim()
  return headers.get('x-real-ip')?.trim() || 'unknown'
}
