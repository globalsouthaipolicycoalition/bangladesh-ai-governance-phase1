/**
 * Per-process burst limiter for sensitive authenticated mutations.
 * A shared Redis/edge limiter is still recommended if the service runs multiple replicas.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function consumeRateLimit(key: string, maxRequests: number, windowMs: number, now = Date.now()) {
  if (!key || !Number.isSafeInteger(maxRequests) || maxRequests < 1 || !Number.isSafeInteger(windowMs) || windowMs < 1) return false;
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    if (!current && buckets.size >= 10_000) {
      for (const [bucketKey, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(bucketKey);
      if (buckets.size >= 10_000) {
        const oldestKey = buckets.keys().next().value;
        if (oldestKey !== undefined) buckets.delete(oldestKey);
      }
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= maxRequests) return false;
  current.count += 1;
  return true;
}

export function resetRateLimitsForTest() {
  buckets.clear();
}
