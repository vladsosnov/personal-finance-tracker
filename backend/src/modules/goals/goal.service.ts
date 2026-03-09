import { listOperationsByGoal } from "./operation.repository";
import type { Goal, GoalView } from "./types";

export const calculateCurrentAmount = async (userId: string, goalId: string): Promise<number> => {
  const operations = await listOperationsByGoal(userId, goalId);
  return operations.reduce((sum, operation) => {
    return operation.type === "INCREASE" ? sum + operation.amount : sum - operation.amount;
  }, 0);
};

export const buildGoalView = async (userId: string, goal: Goal): Promise<GoalView> => {
  const currentAmount = await calculateCurrentAmount(userId, goal.id);
  const progress = goal.targetAmount > 0 ? Math.min((currentAmount / goal.targetAmount) * 100, 100) : 0;

  return {
    id: goal.id,
    title: goal.title,
    targetAmount: goal.targetAmount,
    currentAmount,
    progress,
    createdAt: goal.createdAt,
    operations: await listOperationsByGoal(userId, goal.id),
  };
};
