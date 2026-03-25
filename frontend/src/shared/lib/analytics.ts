import { API_BASE_URL } from "@/shared/constants/auth";

export type TrackedEvent =
  | "login_click"
  | "register_click"
  | "login_success"
  | "register_success"
  | "add_goal_click"
  | "page_view";

export const trackEvent = (event: TrackedEvent, metadata?: Record<string, string>) => {
  fetch(`${API_BASE_URL}/analytics/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ event, metadata }),
  }).catch(() => {});
};
