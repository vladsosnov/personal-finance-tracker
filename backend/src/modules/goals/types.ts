export type OperationType = "INCREASE" | "DECREASE";

export type Goal = {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  initialAmount: number;
  currency: string;
  color: string;
  sortOrder: number;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
};

export type GoalOperation = {
  id: string;
  userId: string;
  goalId: string;
  type: OperationType;
  amount: number;
  currency: string;
  note?: string;
  operationDate: string;
  createdAt: string;
};

export type GoalOperationView = GoalOperation & {
  convertedAmount: number;
};

export type GoalView = {
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
  operations: GoalOperationView[];
};
