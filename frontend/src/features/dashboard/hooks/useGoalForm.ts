import { useState } from "react";
import type { Goal } from "@/features/dashboard/types";
import { DEFAULT_GOAL_COLOR } from "@/shared/constants/goal-colors";

export const useGoalForm = () => {
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState<number | "">("");
  const [initialAmount, setInitialAmount] = useState<number | "">("");
  const [color, setColor] = useState<string>(DEFAULT_GOAL_COLOR);

  const reset = () => {
    setTitle("");
    setTargetAmount("");
    setInitialAmount("");
    setColor(DEFAULT_GOAL_COLOR);
  };

  const loadFromGoal = (goal: Goal) => {
    setTitle(goal.title.slice(0, 80));
    setTargetAmount(goal.targetAmount);
    setInitialAmount(goal.initialAmount > 0 ? goal.initialAmount : "");
    setColor(goal.color);
  };

  const isValid = Boolean(title.trim() && targetAmount && Number(targetAmount) > 0);

  return {
    title,
    targetAmount,
    initialAmount,
    color,
    isValid,
    setTitle,
    setTargetAmount,
    setInitialAmount,
    setColor,
    reset,
    loadFromGoal,
  };
};
