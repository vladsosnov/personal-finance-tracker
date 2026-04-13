import { Schema, model } from "mongoose";
import type { UserRole } from "../../modules/auth/types";

export type BillingPlan = "free" | "pro" | "lifetime";
export type BillingStatus = "inactive" | "active" | "canceled" | "past_due";

export type UserDocument = {
  email: string;
  plan: BillingPlan;
  billingStatus: BillingStatus;
  billingProvider?: "paddle";
  subscription?: string;
  processedPaddleWebhookEventIds?: string[];
  latestPaddleBillingEventAt?: Date;
  paddleCustomerId?: string;
  paddleSubscriptionId?: string;
  paddleTransactionId?: string;
  subscriptionRenewsAt?: Date;
  subscriptionCanceledAt?: Date;
  lifetimeUnlockedAt?: Date;
  role: UserRole;
  primaryCurrency: string;
  passwordHash: string;
  passwordSalt: string;
  googleId?: string;
  tokenVersion: number;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpiry?: Date;
  passwordResetToken?: string;
  passwordResetExpiry?: Date;
};

const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true, index: true },
    subscription: { type: String },
    plan: { type: String, enum: ["free", "pro", "lifetime"], required: true, default: "free" },
    billingStatus: {
      type: String,
      enum: ["inactive", "active", "canceled", "past_due"],
      required: true,
      default: "inactive",
    },
    billingProvider: { type: String, enum: ["paddle"] },
    processedPaddleWebhookEventIds: { type: [String], default: [] },
    latestPaddleBillingEventAt: { type: Date },
    paddleCustomerId: { type: String, unique: true, sparse: true },
    paddleSubscriptionId: { type: String, unique: true, sparse: true },
    paddleTransactionId: { type: String, unique: true, sparse: true },
    subscriptionRenewsAt: { type: Date },
    subscriptionCanceledAt: { type: Date },
    lifetimeUnlockedAt: { type: Date },
    role: { type: String, enum: ["user", "admin"], required: true, default: "user" },
    primaryCurrency: { type: String, required: true, default: "USD" },
    passwordHash: { type: String, required: true, default: "" },
    passwordSalt: { type: String, required: true, default: "" },
    googleId: { type: String, index: true, sparse: true },
    tokenVersion: { type: Number, required: true, default: 0 },
    emailVerified: { type: Boolean, required: true, default: false },
    emailVerificationToken: { type: String, index: true, sparse: true },
    emailVerificationExpiry: { type: Date },
    passwordResetToken: { type: String, index: true, sparse: true },
    passwordResetExpiry: { type: Date },
  },
  { timestamps: true }
);

export const UserModel = model<UserDocument>("User", userSchema);
