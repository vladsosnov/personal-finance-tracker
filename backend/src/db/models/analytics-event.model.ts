import { Schema, model } from "mongoose";

export type AnalyticsEventDocument = {
  event: string;
  userId?: string;
  metadata?: Record<string, string>;
};

const analyticsEventSchema = new Schema<AnalyticsEventDocument>(
  {
    event: { type: String, required: true },
    userId: { type: String, sparse: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

analyticsEventSchema.index({ createdAt: -1 });
analyticsEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
analyticsEventSchema.index({ event: 1, userId: 1 });

export const AnalyticsEventModel = model<AnalyticsEventDocument>("AnalyticsEvent", analyticsEventSchema);
