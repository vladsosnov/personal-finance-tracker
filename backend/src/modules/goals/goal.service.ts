import { listOperationsByGoal } from "./operation.repository";
import type { Goal, GoalView } from "./types";

export const buildGoalView = async (userId: string, goal: Goal): Promise<GoalView> => {
  const operations = await listOperationsByGoal(userId, goal.id);
  const operationsTotal = operations.reduce((sum, op) => (op.type === "INCREASE" ? sum + op.amount : sum - op.amount), 0);
  const currentAmount = goal.initialAmount + operationsTotal;
  const progress = goal.targetAmount > 0 ? Math.min((currentAmount / goal.targetAmount) * 100, 100) : 0;

  return {
    id: goal.id,
    title: goal.title,
    targetAmount: goal.targetAmount,
    initialAmount: goal.initialAmount,
    color: goal.color,
    sortOrder: goal.sortOrder,
    isCompleted: goal.isCompleted,
    completedAt: goal.completedAt,
    currentAmount,
    progress,
    createdAt: goal.createdAt,
    operations,
  };
};
