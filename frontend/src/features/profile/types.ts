import type { OperationType } from "@/shared/gql/__generated__/schema-types";

export type ImportHistoryEntry = {
  date?: string;
  note?: string;
  value?: number;
};

export type ImportOperationEntry = {
  type?: string;
  amount?: number;
  currency?: string;
  note?: string;
  operationDate?: string;
  createdAt?: string;
};

export type ImportGoalEntry = {
  title?: string;
  targetValue?: number;
  initialValue?: number;
  currency?: string;
  history?: ImportHistoryEntry[];
  operations?: ImportOperationEntry[];
  display?: {
    bar?: {
      colors?: {
        primary?: string;
      };
    };
  };
};

export type PreparedImportOperation = {
  type: OperationType;
  amount: number;
  currency?: string;
  note?: string;
  operationDate: string;
};

export type PreparedImportGoal = {
  sourceIndex: number;
  title: string;
  targetAmount: number;
  initialAmount: number;
  currency?: string;
  color: string;
  operationCount: number;
  operations: PreparedImportOperation[];
  canRemoveFromImport: boolean;
};

export type SkippedImportGoal = {
  sourceIndex: number;
  title: string;
  reason: string;
  canInclude: boolean;
};

export type PreparedImportResult = {
  goals: PreparedImportGoal[];
  skippedGoals: SkippedImportGoal[];
};

export type ImportProgressState = {
  completedSteps: number;
  totalSteps: number;
  currentLabel: string;
};
