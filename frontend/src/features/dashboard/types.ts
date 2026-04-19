import type { OperationType } from "@/shared/gql/__generated__/schema-types";

export type Goal = {
  id: string;
  title: string;
  targetAmount: number;
  initialAmount: number;
  currency: string;
  color: string;
  sortOrder: number;
  isCompleted: boolean;
  completedAt?: string;
  currentAmount: number;
  progress: number;
  createdAt: string;
  operations?: GoalOperation[];
};

export type GoalOperation = {
  id: string;
  type: OperationType;
  amount: number;
  currency: string;
  convertedAmount: number;
  note?: string;
  operationDate: string;
  createdAt: string;
};

export type GoalDetails = Goal & {
  operations: GoalOperation[];
};
