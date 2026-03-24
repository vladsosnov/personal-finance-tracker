import type { Goal, GoalDetails } from "@/features/dashboard/types";

export const buildGoalFromDetails = (goal: GoalDetails): Goal => ({
  id: goal.id,
  title: goal.title,
  targetAmount: goal.targetAmount,
  initialAmount: goal.initialAmount,
  color: goal.color,
  sortOrder: goal.sortOrder,
  isCompleted: goal.isCompleted,
  completedAt: goal.completedAt,
  currentAmount: goal.currentAmount,
  progress: goal.progress,
  createdAt: goal.createdAt,
});
