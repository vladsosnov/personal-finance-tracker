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

goalOperationSchema.index({ userId: 1, goalId: 1 });

export const GoalOperationModel = model<GoalOperationDocument>("GoalOperation", goalOperationSchema);
