export type Plan = {
  name: string;
  price: string;
  description: string;
  features: string[];
  maxGoals: number | null;
};

export const FREE_MAX_GOALS = 3;

export const PLANS: Plan[] = [
  {
    name: "Free",
    price: "$0",
    description: "For getting started with your first financial goals.",
    features: [`Up to ${FREE_MAX_GOALS} goals`, "Operations log", "Theme settings"],
    maxGoals: FREE_MAX_GOALS,
  },
  {
    name: "Pro",
    price: "$3/mo",
    description: "For users managing multiple goals with deeper tracking.",
    features: ["Unlimited goals", "Advanced analytics", "More customization"],
    maxGoals: null,
  },
  {
    name: "Lifetime",
    price: "$9 once",
    description: "One-time payment for long-term planning without subscription.",
    features: ["Everything in Pro", "Permanent access"],
    maxGoals: null,
  },
];

export const getPlanByName = (name: string): Plan =>
  PLANS.find((p) => p.name.toLowerCase() === name.toLowerCase()) ?? PLANS[0];
