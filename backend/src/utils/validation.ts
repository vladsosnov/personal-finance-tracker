import { isValidCurrency } from "../shared/currencies";

const MAX_GOAL_TITLE_LENGTH = 80;
const MAX_NOTE_LENGTH = 500;
const FREE_MAX_GOALS = 3;

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const getEffectiveSubscription = (user: { subscription: string; role: string } | null | undefined): string => {
  if (!user) return "Free";
  return user.role === "admin" ? "Lifetime" : user.subscription;
};

export const getMaxGoals = (subscription: string): number | null => {
  return subscription.toLowerCase() === "free" ? FREE_MAX_GOALS : null;
};

export const assertFiniteNonNegative = (value: number, label: string) => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} cannot be negative`);
  }
};

export const assertValidGoalTitle = (title: string) => {
  if (!title.trim()) {
    throw new Error("Goal title is required");
  }

  if (title.trim().length > MAX_GOAL_TITLE_LENGTH) {
    throw new Error(`Goal title must be at most ${MAX_GOAL_TITLE_LENGTH} characters`);
  }
};

export const assertValidNote = (note?: string) => {
  if (note && note.trim().length > MAX_NOTE_LENGTH) {
    throw new Error(`Note must be at most ${MAX_NOTE_LENGTH} characters`);
  }
};

export const toSafeUser = (user: { id: string; email: string; subscription: string; role: string; primaryCurrency: string; emailVerified: boolean }) => ({
  id: user.id,
  email: user.email,
  subscription: user.role === "admin" ? "Lifetime" : user.subscription,
  role: user.role,
  primaryCurrency: user.primaryCurrency,
  emailVerified: user.emailVerified,
});

export const assertValidCurrency = (code: string) => {
  if (!isValidCurrency(code)) {
    throw new Error(`Unsupported currency: ${code}`);
  }
};

export const ensureAuthed = (context: { userId: string | null }): string => {
  if (!context.userId) {
    throw new Error("Unauthorized");
  }
  return context.userId;
};

export const ensureAdmin = (context: { userId: string | null; userRole: string }): string => {
  const userId = ensureAuthed(context);
  if (context.userRole !== "admin") {
    throw new Error("Forbidden");
  }
  return userId;
};
