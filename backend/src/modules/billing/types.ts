export type BillingPlanInput = "FREE" | "PRO" | "LIFETIME";

export type BillingCheckoutPlan = Exclude<BillingPlanInput, "FREE">;

export type BillingCheckoutPayload = {
  url: string;
};

export type BillingPortalPayload = {
  url: string;
};

export const isBillingCheckoutPlan = (plan: BillingPlanInput): plan is BillingCheckoutPlan => {
  return plan === "PRO" || plan === "LIFETIME";
};
