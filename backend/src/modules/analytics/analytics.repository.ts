import { AnalyticsEventModel } from "../../db/models/analytics-event.model";

export const TRACKED_EVENTS = [
  // auth
  "login_click",
  "register_click",
  "login_success",
  "register_success",
  "forgot_password_click",
  "reset_password_submit",
  // dashboard - goals
  "add_goal_click",
  "goal_deleted",
  // dashboard - operations
  "operation_added",
  "operation_deleted",
  // profile
  "profile_page_view",
  "data_exported",
  "data_imported",
  "data_reset",
  "delete_account_click",
] as const;

export type TrackedEvent = (typeof TRACKED_EVENTS)[number];

export const isTrackedEvent = (event: string): event is TrackedEvent =>
  (TRACKED_EVENTS as readonly string[]).includes(event);

export const recordEvent = async (event: string, userId?: string, metadata?: Record<string, string>) => {
  await AnalyticsEventModel.create({ event, userId, metadata });
};

export type EventCount = {
  event: string;
  count: number;
};

export const getEventCounts = async (): Promise<EventCount[]> => {
  const results = await AnalyticsEventModel.aggregate<{ _id: string; count: number }>([
    { $group: { _id: "$event", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  return results.map((r) => ({ event: r._id, count: r.count }));
};

export const getUniqueUserLogins = async (): Promise<number> => {
  const result = await AnalyticsEventModel.distinct("userId", {
    event: "login_success",
    userId: { $ne: null },
  });
  return result.length;
};

const MAX_RECENT_EVENTS = 200;

export const deleteAnalyticsByUser = async (userId: string): Promise<number> => {
  const result = await AnalyticsEventModel.deleteMany({ userId });
  return result.deletedCount ?? 0;
};

export const getRecentEvents = async (limit = 50): Promise<Array<{
  id: string;
  event: string;
  userId: string | null;
  createdAt: string;
}>> => {
  const capped = Math.min(limit, MAX_RECENT_EVENTS);
  const events = await AnalyticsEventModel.find()
    .sort({ createdAt: -1 })
    .limit(capped)
    .lean();

  return events.map((e) => ({
    id: (e._id as { toString(): string }).toString(),
    event: e.event,
    userId: e.userId ?? null,
    createdAt: (e as unknown as { createdAt: Date }).createdAt.toISOString(),
  }));
};
