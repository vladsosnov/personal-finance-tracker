import mongoose, { Schema, model } from "mongoose";

export type GoalDocument = {
  userId: mongoose.Types.ObjectId;
  title: string;
  targetAmount: number;
};

const goalSchema = new Schema<GoalDocument>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true, ref: "User" },
    title: { type: String, required: true },
    targetAmount: { type: Number, required: true },
  },
  { timestamps: true }
);

export const GoalModel = model<GoalDocument>("Goal", goalSchema);
