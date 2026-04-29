type Window = { count: number; resetAt: number };

const store = new Map<string, Window>();

/**
 * Fixed-window in-memory rate limiter.
 * Returns true if the request is allowed, false if rate limit exceeded.
 * Key should include userId + action, e.g. `groqWriting:userId123`.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count++;
  return true;
}

export const RATE_LIMITS = {
  groqWriting: { limit: 50, windowMs: 24 * 60 * 60 * 1000 }, // 50/day
  unsplashSearch: { limit: 20, windowMs: 60 * 1000 }, // 20/min
  dictionaryFetch: { limit: 60, windowMs: 60 * 1000 }, // 60/min
} as const;
