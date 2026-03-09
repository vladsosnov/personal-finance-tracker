import mongoose from "mongoose";
import { GoalModel } from "../../db/models/goal.model";
import type { Goal } from "./types";

const toGoal = (doc: {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  targetAmount: number;
  createdAt: Date;
}): Goal => ({
  id: doc._id.toString(),
  userId: doc.userId.toString(),
  title: doc.title,
  targetAmount: doc.targetAmount,
  createdAt: doc.createdAt.toISOString(),
});

export const createGoal = async (userId: string, title: string, targetAmount: number): Promise<Goal> => {
  const goal = await GoalModel.create({ userId, title, targetAmount });
  return toGoal(
    goal.toObject() as unknown as {
      _id: mongoose.Types.ObjectId;
      userId: mongoose.Types.ObjectId;
      title: string;
      targetAmount: number;
      createdAt: Date;
    }
  );
};

export const listGoalsByUser = async (userId: string): Promise<Goal[]> => {
  const goals = await GoalModel.find({ userId }).sort({ createdAt: -1 }).lean();
  return goals.map((goal) =>
    toGoal(
      goal as unknown as {
        _id: mongoose.Types.ObjectId;
        userId: mongoose.Types.ObjectId;
        title: string;
        targetAmount: number;
        createdAt: Date;
      }
    )
  );
};

export const getGoalById = async (userId: string, goalId: string): Promise<Goal | undefined> => {
  const goal = await GoalModel.findOne({ _id: goalId, userId }).lean();
  return goal
    ? toGoal(
        goal as unknown as {
          _id: mongoose.Types.ObjectId;
          userId: mongoose.Types.ObjectId;
          title: string;
          targetAmount: number;
          createdAt: Date;
        }
      )
    : undefined;
};
