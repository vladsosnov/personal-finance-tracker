import type { OperationType } from "@/shared/gql/__generated__/schema-types";

export type Goal = {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  progress: number;
  createdAt: string;
};

export type GoalOperation = {
  id: string;
  type: OperationType;
  amount: number;
  note?: string;
  createdAt: string;
};

export type GoalDetails = Goal & {
  operations: GoalOperation[];
};
