import mongoose, { Schema, model } from "mongoose";

export type GoalDocument = {
  userId: mongoose.Types.ObjectId;
  title: string;
  targetAmount: number;
  initialAmount: number;
  color: string;
  sortOrder: number;
};

const goalSchema = new Schema<GoalDocument>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true, ref: "User" },
    title: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    initialAmount: { type: Number, required: true, default: 0 },
    color: { type: String, required: true, default: "#0F766E" },
    sortOrder: { type: Number, required: true, default: 0, index: true },
  },
  { timestamps: true }
);

export const GoalModel = model<GoalDocument>("Goal", goalSchema);
