import { useState } from "react";
import type { Goal } from "@/features/dashboard/types";
import { DEFAULT_GOAL_COLOR } from "@/shared/constants/goal-colors";
import { DEFAULT_CURRENCY } from "@/shared/constants/currencies";

export const useGoalForm = (defaultCurrency = DEFAULT_CURRENCY) => {
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState<number | "">("");
  const [initialAmount, setInitialAmount] = useState<number | "">("");
  const [color, setColor] = useState<string>(DEFAULT_GOAL_COLOR);
  const [currency, setCurrency] = useState<string>(defaultCurrency);

  const reset = () => {
    setTitle("");
    setTargetAmount("");
    setInitialAmount("");
    setColor(DEFAULT_GOAL_COLOR);
    setCurrency(defaultCurrency);
  };

  const loadFromGoal = (goal: Goal) => {
    setTitle(goal.title.slice(0, 80));
    setTargetAmount(goal.targetAmount);
    setInitialAmount(goal.initialAmount > 0 ? goal.initialAmount : "");
    setColor(goal.color);
    setCurrency(goal.currency);
  };

  const isValid = Boolean(title.trim() && (targetAmount === 0 || (targetAmount && Number(targetAmount) > 0)));

  return {
    title,
    targetAmount,
    initialAmount,
    color,
    currency,
    isValid,
    setTitle,
    setTargetAmount,
    setInitialAmount,
    setColor,
    setCurrency,
    reset,
    loadFromGoal,
  };
};
