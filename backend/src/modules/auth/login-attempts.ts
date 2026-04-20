const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

type AttemptRecord = {
  count: number;
  lockedUntil: number | null;
};

// In-memory store keyed by email. Same limitation as rate-limit (single process).
const attempts = new Map<string, AttemptRecord>();

// Cleanup stale records every 10 minutes
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, record] of attempts) {
    if (record.lockedUntil && now > record.lockedUntil) {
      attempts.delete(key);
    }
  }
}, 10 * 60 * 1000);
cleanupTimer.unref();

export const isAccountLocked = (email: string): boolean => {
  const record = attempts.get(email);
  if (!record?.lockedUntil) return false;
  if (Date.now() > record.lockedUntil) {
    attempts.delete(email);
    return false;
  }
  return true;
};

export const recordFailedAttempt = (email: string): void => {
  const record = attempts.get(email) ?? { count: 0, lockedUntil: null };
  record.count += 1;
  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
  }
  attempts.set(email, record);
};

export const clearAttempts = (email: string): void => {
  attempts.delete(email);
};

// For testing
export const _resetAll = () => attempts.clear();
