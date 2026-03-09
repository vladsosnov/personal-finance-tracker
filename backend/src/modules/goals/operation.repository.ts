import mongoose from "mongoose";
import { GoalOperationModel } from "../../db/models/goal-operation.model";
import type { GoalOperation, OperationType } from "./types";

const toGoalOperation = (doc: {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  goalId: mongoose.Types.ObjectId;
  type: OperationType;
  amount: number;
  note?: string;
  createdAt: Date;
}): GoalOperation => ({
  id: doc._id.toString(),
  userId: doc.userId.toString(),
  goalId: doc.goalId.toString(),
  type: doc.type,
  amount: doc.amount,
  note: doc.note,
  createdAt: doc.createdAt.toISOString(),
});

export const createGoalOperation = async (
  userId: string,
  goalId: string,
  type: OperationType,
  amount: number,
  note?: string
): Promise<GoalOperation> => {
  const operation = await GoalOperationModel.create({ userId, goalId, type, amount, note });

  return toGoalOperation(
    operation.toObject() as unknown as {
      _id: mongoose.Types.ObjectId;
      userId: mongoose.Types.ObjectId;
      goalId: mongoose.Types.ObjectId;
      type: OperationType;
      amount: number;
      note?: string;
      createdAt: Date;
    }
  );
};

export const listOperationsByGoal = async (userId: string, goalId: string): Promise<GoalOperation[]> => {
  const operations = await GoalOperationModel.find({ userId, goalId }).sort({ createdAt: -1 }).lean();

  return operations.map((operation) =>
    toGoalOperation(
      operation as unknown as {
        _id: mongoose.Types.ObjectId;
        userId: mongoose.Types.ObjectId;
        goalId: mongoose.Types.ObjectId;
        type: OperationType;
        amount: number;
        note?: string;
        createdAt: Date;
      }
    )
  );
};
