import mongoose, { Schema, model } from "mongoose";

export type GoalOperationDocument = {
  userId: mongoose.Types.ObjectId;
  goalId: mongoose.Types.ObjectId;
  type: "INCREASE" | "DECREASE";
  amount: number;
  note?: string;
  operationDate: string;
};

const goalOperationSchema = new Schema<GoalOperationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    goalId: { type: Schema.Types.ObjectId, required: true, ref: "Goal" },
    type: { type: String, required: true, enum: ["INCREASE", "DECREASE"] },
    amount: { type: Number, required: true },
    note: { type: String },
    operationDate: { type: String, required: true },
  },
  { timestamps: true }
);

// Compound indexes for common query patterns
goalOperationSchema.index({ userId: 1, goalId: 1 });
goalOperationSchema.index({ userId: 1, operationDate: -1, createdAt: -1 });
goalOperationSchema.index({ goalId: 1, operationDate: -1, createdAt: -1 });

export const GoalOperationModel = model<GoalOperationDocument>("GoalOperation", goalOperationSchema);
