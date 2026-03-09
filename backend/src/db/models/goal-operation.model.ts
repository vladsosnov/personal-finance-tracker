import mongoose, { Schema, model } from "mongoose";

export type GoalOperationDocument = {
  userId: mongoose.Types.ObjectId;
  goalId: mongoose.Types.ObjectId;
  type: "INCREASE" | "DECREASE";
  amount: number;
  note?: string;
};

const goalOperationSchema = new Schema<GoalOperationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true, ref: "User" },
    goalId: { type: Schema.Types.ObjectId, required: true, index: true, ref: "Goal" },
    type: { type: String, required: true, enum: ["INCREASE", "DECREASE"] },
    amount: { type: Number, required: true },
    note: { type: String },
  },
  { timestamps: true }
);

export const GoalOperationModel = model<GoalOperationDocument>("GoalOperation", goalOperationSchema);
