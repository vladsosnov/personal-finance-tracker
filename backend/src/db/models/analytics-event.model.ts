import { Schema, model } from "mongoose";

export type AnalyticsEventDocument = {
  event: string;
  userId?: string;
  metadata?: Record<string, string>;
};

const analyticsEventSchema = new Schema<AnalyticsEventDocument>(
  {
    event: { type: String, required: true, index: true },
    userId: { type: String, index: true, sparse: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const AnalyticsEventModel = model<AnalyticsEventDocument>("AnalyticsEvent", analyticsEventSchema);
