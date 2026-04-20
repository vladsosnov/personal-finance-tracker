import { getEventCounts, getUniqueUserLogins, getRecentEvents } from "./analytics.repository";
import { ensureAdmin } from "../../utils/validation";

type Context = {
  userId: string | null;
  userRole: "user" | "admin";
  tokenVersion: number;
  clientIp: string;
};

export const analyticsResolvers = {
  analyticsStats: async (_args: unknown, context: Context) => {
    await ensureAdmin(context);
    const [eventCounts, uniqueUserLogins, recentEvents] = await Promise.all([
      getEventCounts(),
      getUniqueUserLogins(),
      getRecentEvents(100),
    ]);
    return { eventCounts, uniqueUserLogins, recentEvents };
  },
};
