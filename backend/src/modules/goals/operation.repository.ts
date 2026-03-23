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
  operationDate?: string;
  createdAt: Date;
}): GoalOperation => ({
  id: doc._id.toString(),
  userId: doc.userId.toString(),
  goalId: doc.goalId.toString(),
  type: doc.type,
  amount: doc.amount,
  note: doc.note,
  operationDate: doc.operationDate ?? doc.createdAt.toISOString().slice(0, 10),
  createdAt: doc.createdAt.toISOString(),
});

export const createGoalOperation = async (
  userId: string,
  goalId: string,
  type: OperationType,
  amount: number,
  note?: string,
  operationDate?: string
): Promise<GoalOperation> => {
  const operation = await GoalOperationModel.create({
    userId,
    goalId,
    type,
    amount,
    note,
    operationDate: operationDate ?? new Date().toISOString().slice(0, 10),
  });

  return toGoalOperation(
    operation.toObject() as unknown as {
      _id: mongoose.Types.ObjectId;
      userId: mongoose.Types.ObjectId;
      goalId: mongoose.Types.ObjectId;
      type: OperationType;
      amount: number;
      note?: string;
      operationDate: string;
      createdAt: Date;
    }
  );
};

export const listOperationsByGoal = async (userId: string, goalId: string): Promise<GoalOperation[]> => {
  const operations = await GoalOperationModel.find({ userId, goalId }).sort({ operationDate: -1, createdAt: -1 }).lean();

  return operations.map((operation) =>
    toGoalOperation(
      operation as unknown as {
        _id: mongoose.Types.ObjectId;
        userId: mongoose.Types.ObjectId;
        goalId: mongoose.Types.ObjectId;
        type: OperationType;
        amount: number;
        note?: string;
        operationDate?: string;
        createdAt: Date;
      }
    )
  );
};
