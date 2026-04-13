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

type PlanSource = {
  role: string;
  plan?: BillingPlan | string;
  subscription?: string;
};

export const getEffectivePlan = (
  user: PlanSource | null | undefined
): BillingPlan => {
  if (!user) return "free";
  const normalizedPlan = normalizeBillingPlan(
    typeof user.plan === "string" ? user.plan.toLowerCase() : user.subscription?.toLowerCase()
  );

  return user.role === "admin" ? "lifetime" : normalizedPlan;
};

export const getSubscriptionLabel = (plan: BillingPlan): string => {
  if (plan === "pro") return "Pro";
  if (plan === "lifetime") return "Lifetime";
  return "Free";
};

export const getEffectiveSubscription = (
  user: PlanSource | null | undefined
): string => {
  return getSubscriptionLabel(getEffectivePlan(user));
};

export const getMaxGoals = (plan: BillingPlan | string): number | null => {
  return normalizeBillingPlan(plan.toLowerCase()) === "free" ? FREE_MAX_GOALS : null;
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

export type SafeUserSource = {
  id: string;
  email: string;
  plan?: BillingPlan | string;
  subscription?: string;
  role: string;
  primaryCurrency: string;
  emailVerified: boolean;
};

export const toSafeUser = (user: SafeUserSource) => ({
  id: user.id,
  email: user.email,
  subscription: getSubscriptionLabel(getEffectivePlan(user)),
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
