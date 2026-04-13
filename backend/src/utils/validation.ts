import { isValidCurrency } from "../shared/currencies";
import type { BillingPlan } from "../db/models/user.model";

const MAX_GOAL_TITLE_LENGTH = 80;
const MAX_NOTE_LENGTH = 500;
const FREE_MAX_GOALS = 3;

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeBillingPlan = (plan: string | undefined): BillingPlan => {
  if (plan === "pro" || plan === "lifetime") return plan;
  return "free";
};

export const getEffectivePlan = (
  user: { role: string; plan: BillingPlan } | null | undefined
): BillingPlan => {
  if (!user) return "free";
  return user.role === "admin" ? "lifetime" : user.plan;
};

export const getSubscriptionLabel = (plan: BillingPlan): string => {
  if (plan === "pro") return "Pro";
  if (plan === "lifetime") return "Lifetime";
  return "Free";
};

export const getEffectiveSubscription = (
  user: { subscription?: string; plan?: BillingPlan | string; role: string } | null | undefined
): string => {
  if (!user) return "Free";
  const normalizedPlan = normalizeBillingPlan(
    typeof user.plan === "string" ? user.plan.toLowerCase() : user.subscription?.toLowerCase()
  );
  return getSubscriptionLabel(user.role === "admin" ? "lifetime" : normalizedPlan ?? "free");
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

export const toSafeUser = (user: {
  id: string;
  email: string;
  plan?: BillingPlan | string;
  subscription?: string;
  role: string;
  primaryCurrency: string;
  emailVerified: boolean;
}) => ({
  id: user.id,
  email: user.email,
  subscription: getSubscriptionLabel(
    user.role === "admin"
      ? "lifetime"
      : normalizeBillingPlan(typeof user.plan === "string" ? user.plan.toLowerCase() : user.subscription?.toLowerCase())
  ),
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
