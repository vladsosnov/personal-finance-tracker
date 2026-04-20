import { createCheckoutForUser, createPortalForUser } from "./billing.service";
import type { BillingPlanInput } from "./types";
import { isBillingCheckoutPlan } from "./types";
import { ensureAuthed } from "../../utils/validation";

type Context = {
  userId: string | null;
  userRole: "user" | "admin";
  tokenVersion: number;
  clientIp: string;
};

type BillingCheckoutArgs = {
  plan: BillingPlanInput;
};

export const billingResolvers = {
  createBillingCheckout: async ({ plan }: BillingCheckoutArgs, context: Context) => {
    const userId = ensureAuthed(context);
    if (!isBillingCheckoutPlan(plan)) {
      throw new Error("Only PRO and LIFETIME checkout plans are supported");
    }

    return createCheckoutForUser(userId, plan);
  },
  createBillingPortalSession: async (_args: unknown, context: Context) => {
    const userId = ensureAuthed(context);
    return createPortalForUser(userId);
  },
};
