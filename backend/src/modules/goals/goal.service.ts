import { listAllOperationsByUser, listOperationsByGoal } from "./operation.repository";
import type { Goal, GoalOperation, GoalView } from "./types";

const buildGoalViewFromOperations = (goal: Goal, operations: GoalOperation[]): GoalView => {
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

export const buildGoalView = async (userId: string, goal: Goal): Promise<GoalView> => {
  const operations = await listOperationsByGoal(userId, goal.id);
  return buildGoalViewFromOperations(goal, operations);
};

export const buildGoalViews = async (userId: string, goals: Goal[]): Promise<GoalView[]> => {
  const allOperations = await listAllOperationsByUser(userId);
  const operationsByGoal = new Map<string, GoalOperation[]>();
  for (const op of allOperations) {
    const list = operationsByGoal.get(op.goalId) ?? [];
    list.push(op);
    operationsByGoal.set(op.goalId, list);
  }
  return goals.map((goal) => buildGoalViewFromOperations(goal, operationsByGoal.get(goal.id) ?? []));
};
