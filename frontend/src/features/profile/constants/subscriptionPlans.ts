export const SUBSCRIPTION_PLANS = [
  {
    name: "Free",
    price: "$0",
    description: "Good for getting started with core goal tracking.",
    features: ["Goal tracking", "Operations log", "Theme settings"],
  },
  {
    name: "Pro",
    price: "$3/mo",
    description: "For users who want deeper planning and more advanced insights.",
    features: ["Everything in Free", "Advanced analytics", "More customization"],
  },
  {
    name: "Lifetime",
    price: "$9 once",
    description: "One-time purchase for long-term use without a subscription.",
    features: ["Everything in Pro", "Permanent access"],
  },
] as const;
