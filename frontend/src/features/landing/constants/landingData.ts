import { APP_ROUTES } from "@/shared/constants/routes";

export const FEATURES = [
  {
    title: "Track progress with operations",
    description: "Add increases and decreases with your own date, edit them later, and keep the history clean.",
  },
  {
    title: "Understand progress over time",
    description: "Review charts, trend direction, filters, and completion pace instead of guessing from one balance.",
  },
  {
    title: "Import existing savings history",
    description: "Bring progress from a .txt export, preview what will be imported, and keep control over skipped items.",
  },
  {
    title: "Work the way you prefer",
    description: "Choose light, dark, or system theme, reorder goals, manage completed goals, and keep the dashboard focused.",
  },
];

export const FUTURE_FEATURES = [
  {
    title: "Multi-currency goals",
    description: "Track goals in different currencies with clearer per-goal currency handling and stronger reporting.",
  },
  {
    title: "Internationalization",
    description: "Localize dates, numbers, labels, and interface copy for users in different languages and regions.",
  },
  {
    title: "Monthly budget planning",
    description: "Plan recurring categories like rent, food, transport, savings, and compare plan versus actual.",
  },
  {
    title: "Recurring operations",
    description: "Automate repeating contributions like salary transfers, rent, subscriptions, and monthly savings.",
  },
  {
    title: "Goal reminders",
    description: "Get nudges for inactive goals, upcoming deadlines, and monthly saving targets.",
  },
];

export const PLANS = [
  {
    name: "Free",
    price: "$0",
    description: "For getting started with your first financial goal.",
    features: ["Goal tracking", "Operations log", "Theme settings"],
    cta: "Start free",
    href: APP_ROUTES.auth,
    highlight: false,
  },
  {
    name: "Pro",
    price: "$3/mo",
    description: "For users managing multiple goals with deeper tracking.",
    features: ["Everything in Free", "Advanced analytics", "More customization"],
    cta: "Coming soon",
    href: APP_ROUTES.auth,
    highlight: false,
  },
  {
    name: "Lifetime",
    price: "$9 once",
    description: "One-time payment for long-term planning without subscription.",
    features: ["Everything in Pro", "Permanent access"],
    cta: "Coming soon",
    href: APP_ROUTES.auth,
    highlight: true,
  },
] as const;
