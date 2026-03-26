import { APP_ROUTES } from "@/shared/constants/routes";
import { PLANS } from "@/shared/constants/plans";

export const LANDING_PLANS = PLANS.map((plan) => ({
  ...plan,
  cta: plan.name === "Free" ? "Start free" : "Coming soon",
  href: APP_ROUTES.auth,
  highlight: plan.name === "Lifetime",
}));
