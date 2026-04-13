import type { BillingPlan, BillingStatus } from "../../db/models/user.model";

export type UserRole = "user" | "admin";

export type User = {
  id: string;
  email: string;
  subscription: string;
  plan: BillingPlan;
  billingStatus: BillingStatus;
  billingProvider?: "paddle";
  paddleCustomerId?: string;
  paddleSubscriptionId?: string;
  paddleTransactionId?: string;
  subscriptionRenewsAt?: string;
  subscriptionCanceledAt?: string;
  lifetimeUnlockedAt?: string;
  role: UserRole;
  primaryCurrency: string;
  passwordHash: string;
  passwordSalt: string;
  googleId?: string;
  tokenVersion: number;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpiry?: string;
  passwordResetToken?: string;
  passwordResetExpiry?: string;
};
