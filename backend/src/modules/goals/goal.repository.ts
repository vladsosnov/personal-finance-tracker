import mongoose from "mongoose";
import { GoalModel } from "../../db/models/goal.model";
import type { Goal } from "./types";

const toGoal = (doc: {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  targetAmount: number;
  initialAmount?: number;
  color?: string;
  sortOrder?: number;
  isCompleted?: boolean;
  completedAt?: Date | null;
  createdAt: Date;
}): Goal => ({
  id: doc._id.toString(),
  userId: doc.userId.toString(),
  title: doc.title,
  targetAmount: doc.targetAmount,
  initialAmount: doc.initialAmount ?? 0,
  color: doc.color ?? "#0F766E",
  sortOrder: doc.sortOrder ?? 0,
  isCompleted: doc.isCompleted ?? false,
  completedAt: doc.completedAt?.toISOString(),
  createdAt: doc.createdAt.toISOString(),
});

export const createGoal = async (
  userId: string,
  title: string,
  targetAmount: number,
  initialAmount = 0,
  color = "#0F766E"
): Promise<Goal> => {
  const lastGoal = await GoalModel.findOne({ userId }).sort({ sortOrder: -1, createdAt: -1 }).lean();
  const nextSortOrder = (lastGoal?.sortOrder ?? -1) + 1;
  const goal = await GoalModel.create({ userId, title, targetAmount, initialAmount, color, sortOrder: nextSortOrder });
  return toGoal(
    goal.toObject() as unknown as {
      _id: mongoose.Types.ObjectId;
      userId: mongoose.Types.ObjectId;
      title: string;
      targetAmount: number;
      initialAmount: number;
      color: string;
      sortOrder: number;
      isCompleted?: boolean;
      completedAt?: Date | null;
      createdAt: Date;
    }
  );
};

export const bulkCreateGoals = async (
  userId: string,
  goals: Array<{
    title: string;
    targetAmount: number;
    initialAmount: number;
    color: string;
  }>
): Promise<Goal[]> => {
  if (!goals.length) {
    return [];
  }

  const lastGoal = await GoalModel.findOne({ userId }).sort({ sortOrder: -1, createdAt: -1 }).lean();
  const nextSortOrder = (lastGoal?.sortOrder ?? -1) + 1;

  const createdGoals = await GoalModel.insertMany(
    goals.map((goal, index) => ({
      userId,
      title: goal.title,
      targetAmount: goal.targetAmount,
      initialAmount: goal.initialAmount,
      color: goal.color,
      sortOrder: nextSortOrder + index,
      isCompleted: false,
    }))
  );

  return createdGoals.map((goal) =>
    toGoal(
      goal.toObject() as unknown as {
        _id: mongoose.Types.ObjectId;
        userId: mongoose.Types.ObjectId;
        title: string;
        targetAmount: number;
        initialAmount?: number;
        color?: string;
        sortOrder?: number;
        isCompleted?: boolean;
        completedAt?: Date | null;
        createdAt: Date;
      }
    )
  );
};

export const listGoalsByUser = async (userId: string): Promise<Goal[]> => {
  const goals = await GoalModel.find({ userId }).sort({ sortOrder: 1, createdAt: 1 }).lean();
  return goals.map((goal) =>
    toGoal(
      goal as unknown as {
        _id: mongoose.Types.ObjectId;
        userId: mongoose.Types.ObjectId;
        title: string;
        targetAmount: number;
        initialAmount?: number;
        color?: string;
        sortOrder?: number;
        isCompleted?: boolean;
        completedAt?: Date | null;
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
        initialAmount?: number;
        color?: string;
        sortOrder?: number;
        isCompleted?: boolean;
        completedAt?: Date | null;
        createdAt: Date;
      }
    )
    : undefined;
};

export const updateGoalCompletion = async (
  userId: string,
  goalId: string,
  isCompleted: boolean,
  completedAt?: string
): Promise<Goal | undefined> => {
  const goal = await GoalModel.findOneAndUpdate(
    { _id: goalId, userId },
    {
      $set: {
        isCompleted,
        completedAt: isCompleted && completedAt ? new Date(completedAt) : null,
      },
    },
    { new: true }
  ).lean();

  return goal
    ? toGoal(
        goal as unknown as {
          _id: mongoose.Types.ObjectId;
          userId: mongoose.Types.ObjectId;
          title: string;
          targetAmount: number;
          initialAmount?: number;
          color?: string;
          sortOrder?: number;
          isCompleted?: boolean;
          completedAt?: Date | null;
          createdAt: Date;
        }
      )
    : undefined;
};

export const deleteGoal = async (userId: string, goalId: string): Promise<Goal | undefined> => {
  const goal = await GoalModel.findOneAndDelete({ _id: goalId, userId }).lean();

  return goal
    ? toGoal(
        goal as unknown as {
          _id: mongoose.Types.ObjectId;
          userId: mongoose.Types.ObjectId;
        title: string;
        targetAmount: number;
        initialAmount?: number;
        color?: string;
        sortOrder?: number;
        isCompleted?: boolean;
        completedAt?: Date | null;
        createdAt: Date;
      }
    )
    : undefined;
};

export const deleteAllGoalsByUser = async (userId: string): Promise<number> => {
  const result = await GoalModel.deleteMany({ userId });
  return result.deletedCount ?? 0;
};

export const reorderGoals = async (userId: string, orderedGoalIds: string[]): Promise<void> => {
  const goals = await GoalModel.find({ userId }).select("_id").lean();
  if (goals.length !== orderedGoalIds.length) {
    throw new Error("Goal order payload is invalid");
  }

  const existingIds = new Set(goals.map((goal) => goal._id.toString()));
  const incomingIds = new Set(orderedGoalIds);
  if (existingIds.size !== incomingIds.size || orderedGoalIds.some((goalId) => !existingIds.has(goalId))) {
    throw new Error("Goal order payload is invalid");
  }

  await Promise.all(
    orderedGoalIds.map((goalId, index) =>
      GoalModel.updateOne({ _id: goalId, userId }, { $set: { sortOrder: index } })
    )
  );
};

export const updateGoalColor = async (userId: string, goalId: string, color: string): Promise<Goal | undefined> => {
  const goal = await GoalModel.findOneAndUpdate({ _id: goalId, userId }, { $set: { color } }, { new: true }).lean();

  return goal
    ? toGoal(
        goal as unknown as {
          _id: mongoose.Types.ObjectId;
          userId: mongoose.Types.ObjectId;
        title: string;
        targetAmount: number;
        initialAmount?: number;
        color?: string;
        sortOrder?: number;
        isCompleted?: boolean;
        completedAt?: Date | null;
        createdAt: Date;
      }
    )
    : undefined;
};

export const updateGoal = async (
  userId: string,
  goalId: string,
  updates: {
    title: string;
    targetAmount: number;
    initialAmount: number;
    color: string;
  }
): Promise<Goal | undefined> => {
  const goal = await GoalModel.findOneAndUpdate(
    { _id: goalId, userId },
    {
      $set: {
        title: updates.title,
        targetAmount: updates.targetAmount,
        initialAmount: updates.initialAmount,
        color: updates.color,
      },
    },
    { new: true }
  ).lean();

  return goal
    ? toGoal(
        goal as unknown as {
          _id: mongoose.Types.ObjectId;
          userId: mongoose.Types.ObjectId;
          title: string;
          targetAmount: number;
          initialAmount?: number;
          color?: string;
          sortOrder?: number;
          createdAt: Date;
        }
      )
    : undefined;
};
