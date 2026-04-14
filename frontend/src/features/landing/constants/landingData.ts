import { APP_ROUTES } from "@/shared/constants/routes";
import { PLANS } from "@/shared/constants/plans";

export const LANDING_PLANS = PLANS.map((plan) => ({
  ...plan,
  cta: plan.name === "Free" ? "Start free" : plan.name === "Pro" ? "Get Pro" : "Get Lifetime",
  href: plan.name === "Free"
    ? APP_ROUTES.auth
    : `${APP_ROUTES.profile}?upgrade=${plan.name.toLowerCase()}`,
  highlight: plan.name === "Lifetime",
}));
