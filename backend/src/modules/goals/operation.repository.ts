import mongoose from "mongoose";
import { GoalOperationModel } from "../../db/models/goal-operation.model";
import type { GoalOperation, OperationType } from "./types";

const toGoalOperation = (doc: {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  goalId: mongoose.Types.ObjectId;
  type: OperationType;
  amount: number;
  currency?: string;
  note?: string;
  operationDate?: string;
  createdAt: Date;
}): GoalOperation => ({
  id: doc._id.toString(),
  userId: doc.userId.toString(),
  goalId: doc.goalId.toString(),
  type: doc.type,
  amount: doc.amount,
  currency: doc.currency ?? "USD",
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
  operationDate?: string,
  currency?: string
): Promise<GoalOperation> => {
  const operation = await GoalOperationModel.create({
    userId,
    goalId,
    type,
    amount,
    currency: currency ?? "USD",
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

export const bulkCreateGoalOperations = async (
  operations: Array<{
    userId: string;
    goalId: string;
    type: OperationType;
    amount: number;
    currency?: string;
    note?: string;
    operationDate: string;
  }>
): Promise<GoalOperation[]> => {
  if (!operations.length) {
    return [];
  }

  const createdOperations = await GoalOperationModel.insertMany(
    operations.map((operation) => ({
      userId: operation.userId,
      goalId: operation.goalId,
      type: operation.type,
      amount: operation.amount,
      currency: operation.currency ?? "USD",
      note: operation.note,
      operationDate: operation.operationDate,
    }))
  );

  return createdOperations.map((operation) =>
    toGoalOperation(
      operation.toObject() as unknown as {
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

export const getGoalOperationById = async (userId: string, operationId: string): Promise<GoalOperation | undefined> => {
  const operation = await GoalOperationModel.findOne({ _id: operationId, userId }).lean();

  return operation
    ? toGoalOperation(
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
    : undefined;
};

export const updateGoalOperation = async (
  userId: string,
  operationId: string,
  updates: {
    type: OperationType;
    amount: number;
    currency?: string;
    note?: string;
    operationDate?: string;
  }
): Promise<GoalOperation | undefined> => {
  const setFields: Record<string, unknown> = {
    type: updates.type,
    amount: updates.amount,
    note: updates.note,
    operationDate: updates.operationDate ?? new Date().toISOString().slice(0, 10),
  };
  if (updates.currency) setFields.currency = updates.currency;

  const operation = await GoalOperationModel.findOneAndUpdate(
    { _id: operationId, userId },
    { $set: setFields },
    { new: true }
  ).lean();

  return operation
    ? toGoalOperation(
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
    : undefined;
};

export const deleteGoalOperation = async (userId: string, operationId: string): Promise<GoalOperation | undefined> => {
  const operation = await GoalOperationModel.findOneAndDelete({ _id: operationId, userId }).lean();

  return operation
    ? toGoalOperation(
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
    : undefined;
};

export const deleteOperationsByGoal = async (userId: string, goalId: string): Promise<void> => {
  await GoalOperationModel.deleteMany({ userId, goalId });
};

export const deleteAllOperationsByUser = async (userId: string): Promise<number> => {
  const result = await GoalOperationModel.deleteMany({ userId });
  return result.deletedCount ?? 0;
};

export const listAllOperationsByUser = async (userId: string): Promise<GoalOperation[]> => {
  const operations = await GoalOperationModel.find({ userId }).sort({ operationDate: -1, createdAt: -1 }).lean();

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
