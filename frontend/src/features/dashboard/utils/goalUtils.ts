import type { Goal, GoalDetails, GoalOperation } from "@/features/dashboard/types";
import { dateStringToUtcTimestamp } from "@/shared/utils/date";

export const buildGoalFromDetails = (goal: GoalDetails): Goal => ({
  id: goal.id,
  title: goal.title,
  targetAmount: goal.targetAmount,
  initialAmount: goal.initialAmount,
  currency: goal.currency,
  color: goal.color,
  sortOrder: goal.sortOrder,
  isCompleted: goal.isCompleted,
  completedAt: goal.completedAt,
  currentAmount: goal.currentAmount,
  progress: goal.progress,
  createdAt: goal.createdAt,
});

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_PREDICTION_DAYS = 365 * 5;

/**
 * Estimate when a goal will be completed based on linear regression of operation history.
 * Returns a formatted date string like "Jun 2026", or null if projection isn't possible.
 */
export const getProjectedDate = (
  operations: GoalOperation[],
  targetAmount: number,
  currentAmount: number,
  isCompleted: boolean,
): string | null => {
  if (isCompleted || targetAmount <= 0 || currentAmount >= targetAmount) return null;

  const sorted = [...operations].sort((a, b) =>
    a.operationDate.localeCompare(b.operationDate) || a.createdAt.localeCompare(b.createdAt),
  );

  // Build cumulative series
  let total = 0;
  const data: Array<[number, number]> = sorted.map((op) => {
    total += op.type === "INCREASE" ? op.convertedAmount : -op.convertedAmount;
    return [dateStringToUtcTimestamp(op.operationDate), total];
  });

  if (data.length < 2) return null;

  // Linear regression
  const n = data.length;
  const origin = data[0][0];
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

  for (const [x, y] of data) {
    const xN = x - origin;
    sumX += xN;
    sumY += y;
    sumXY += xN * y;
    sumXX += xN * xN;
  }

  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  if (slope <= 0) return null;

  const daysToTarget = (targetAmount - intercept) / slope;
  const targetTimestamp = origin + daysToTarget;
  const lastTimestamp = data[data.length - 1][0];
  const projectionDays = (targetTimestamp - lastTimestamp) / DAY_MS;

  if (projectionDays <= 0 || projectionDays > MAX_PREDICTION_DAYS) return null;

  return new Date(targetTimestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });
};
