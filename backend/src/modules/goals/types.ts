export type OperationType = "INCREASE" | "DECREASE";

export type Goal = {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  createdAt: string;
};

export type GoalOperation = {
  id: string;
  userId: string;
  goalId: string;
  type: OperationType;
  amount: number;
  note?: string;
  createdAt: string;
};

export type GoalView = {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  progress: number;
  createdAt: string;
  operations: GoalOperation[];
};
