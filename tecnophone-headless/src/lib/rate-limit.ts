import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple in-memory sliding-window rate limiter.
 * On serverless (Vercel) each cold start resets the map, but it still protects
 * against bursts within a single instance lifetime.
 */

interface RateEntry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Map<string, RateEntry>>();

// Cleanup stale entries every 60 s
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    buckets.forEach((map) => {
      map.forEach((v, k) => {
        if (now > v.resetAt) map.delete(k);
      });
    });
  }, 60_000);
}

export interface RateLimitConfig {
  /** Unique bucket name (e.g. 'checkout', 'ai-chat') */
  name: string;
  /** Time window in ms (default 60 000 = 1 min) */
  windowMs?: number;
  /** Max requests per window (default 10) */
  max?: number;
}

/**
 * Returns a 429 NextResponse if the IP exceeds the limit, or `null` if OK.
 */
export function rateLimit(
  req: NextRequest,
  config: RateLimitConfig,
): NextResponse | null {
  const { name, windowMs = 60_000, max = 10 } = config;
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  if (!buckets.has(name)) buckets.set(name, new Map());
  const map = buckets.get(name)!;

  const now = Date.now();
  const entry = map.get(ip);

  if (!entry || now > entry.resetAt) {
    map.set(ip, { count: 1, resetAt: now + windowMs });
    return null;
  }

  entry.count++;
  if (entry.count > max) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta de nuevo en un momento.' },
      { status: 429 },
    );
  }

  return null;
}
