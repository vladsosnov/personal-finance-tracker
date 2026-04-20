import type { Request, Response, NextFunction } from "express";

type RateBucket = {
  count: number;
  windowStart: number;
};

// LIMITATION: In-memory, single-process rate limiter.
// - Resets on every deploy/restart (attacker gets fresh window)
// - Not shared across instances (horizontal scaling bypasses limits)
// - Acceptable for single-instance Render deployments
//
// Migration path for multi-instance:
// 1. Add ioredis dependency
// 2. Replace Map with Redis INCR + EXPIRE (sliding window)
// 3. Key format stays the same: `${prefix}:${ip}`
// 4. Consider rate-limit libraries: express-rate-limit + rate-limit-redis
const rateBuckets = new Map<string, RateBucket>();

const RATE_LIMIT_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const rateLimitCleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateBuckets) {
    if (now - bucket.windowStart >= 15 * 60 * 1000) {
      rateBuckets.delete(key);
    }
  }
}, RATE_LIMIT_CLEANUP_INTERVAL_MS);
rateLimitCleanupTimer.unref();

export const createRateLimit = (keyPrefix: string, limit: number, windowMs: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${keyPrefix}:${req.ip ?? "unknown"}`;
    const now = Date.now();
    const current = rateBuckets.get(key);

    if (!current || now - current.windowStart >= windowMs) {
      rateBuckets.set(key, { count: 1, windowStart: now });
      next();
      return;
    }

    if (current.count >= limit) {
      res.status(429).json({ error: "Too many requests. Please try again later." });
      return;
    }

    current.count += 1;
    rateBuckets.set(key, current);
    next();
  };
};
