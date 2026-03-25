import { APP_ROUTES } from "@/shared/constants/routes";
import { PLANS } from "@/shared/constants/plans";

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

export const LANDING_PLANS = PLANS.map((plan) => ({
  ...plan,
  cta: plan.name === "Free" ? "Start free" : "Coming soon",
  href: APP_ROUTES.auth,
  highlight: plan.name === "Lifetime",
}));
