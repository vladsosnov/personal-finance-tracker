import { API_BASE_URL } from "@/shared/constants/auth";

export type TrackedEvent =
  // auth
  | "login_click"
  | "register_click"
  | "forgot_password_click"
  | "reset_password_submit"
  // dashboard - goals
  | "add_goal_click"
  | "goal_deleted"
  // dashboard - operations
  | "operation_added"
  | "operation_deleted"
  // profile
  | "profile_page_view"
  | "data_exported"
  | "data_imported"
  | "data_reset"
  | "delete_account_click";

export const trackEvent = (event: TrackedEvent, metadata?: Record<string, string>) => {
  fetch(`${API_BASE_URL}/analytics/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ event, metadata }),
  }).catch(() => {});
};
