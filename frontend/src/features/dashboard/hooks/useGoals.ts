import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  COMPLETE_GOAL,
  CREATE_GOAL,
  DELETE_GOAL,
  EDIT_GOAL,
  GET_GOALS,
  REORDER_GOALS,
  type GoalsQueryData,
} from "@/features/dashboard/gql/dashboard";
import type { Goal } from "@/features/dashboard/types";
import { showToast } from "@/shared/lib/toast-store";

export const useGoals = () => {
  const [optimisticGoals, setOptimisticGoals] = useState<Goal[] | null>(null);

  const {
    data: goalsData,
    previousData: previousGoalsData,
    loading: isLoadingGoals,
    error: goalsError,
    refetch: refetchGoals,
  } = useQuery<GoalsQueryData>(GET_GOALS);

  const serverGoals = useMemo(
    () => goalsData?.goals ?? previousGoalsData?.goals ?? [],
    [goalsData, previousGoalsData]
  );

  useEffect(() => {
    if (!optimisticGoals) return;

    const hasSameOrder =
      optimisticGoals.length === serverGoals.length &&
      optimisticGoals.every((goal, index) => goal.id === serverGoals[index]?.id);

    if (hasSameOrder) setOptimisticGoals(null);
  }, [optimisticGoals, serverGoals]);

  const goals = optimisticGoals ?? serverGoals;
  const activeGoals = useMemo(() => goals.filter((g) => !g.isCompleted), [goals]);
  const completedGoals = useMemo(() => goals.filter((g) => g.isCompleted), [goals]);

  const [createGoalMutation] = useMutation(CREATE_GOAL);
  const [completeGoalMutation] = useMutation(COMPLETE_GOAL);
  const [deleteGoalMutation] = useMutation(DELETE_GOAL);
  const [editGoalMutation] = useMutation(EDIT_GOAL);
  const [reorderGoalsMutation] = useMutation(REORDER_GOALS);

  const createGoal = async (input: {
    title: string;
    targetAmount: number;
    initialAmount: number;
    color: string;
    currency: string;
  }) => {
    try {
      await createGoalMutation({
        variables: {
          title: input.title.trim().slice(0, 80),
          targetAmount: input.targetAmount,
          initialAmount: input.initialAmount,
          color: input.color,
          currency: input.currency,
        },
      });
      refetchGoals();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to create goal", "red");
      throw error;
    }
  };

  const editGoal = async (
    goalId: string,
    input: { title: string; targetAmount: number; initialAmount: number; color: string; currency: string }
  ): Promise<Goal | null> => {
    try {
      const result = await editGoalMutation({
        variables: {
          goalId,
          title: input.title.trim().slice(0, 80),
          targetAmount: input.targetAmount,
          initialAmount: input.initialAmount,
          color: input.color,
          currency: input.currency,
        },
      });
      refetchGoals();
      return (result.data as { editGoal?: Goal } | undefined)?.editGoal ?? null;
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to update goal", "red");
      throw error;
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      await deleteGoalMutation({ variables: { goalId } });
      refetchGoals();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to remove goal", "red");
      throw error;
    }
  };

  const completeGoal = async (goalId: string) => {
    try {
      await completeGoalMutation({ variables: { goalId } });
      refetchGoals();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to complete goal", "red");
      throw error;
    }
  };

  const reorderGoals = async (fromId: string, toId: string) => {
    const nextGoals = [...activeGoals];
    const fromIndex = nextGoals.findIndex((g) => g.id === fromId);
    const toIndex = nextGoals.findIndex((g) => g.id === toId);
    if (fromIndex < 0 || toIndex < 0) return;

    const [moved] = nextGoals.splice(fromIndex, 1);
    nextGoals.splice(toIndex, 0, moved);

    const reorderedActive = nextGoals.map((g, i) => ({ ...g, sortOrder: i }));
    const reorderedAll = [
      ...reorderedActive,
      ...completedGoals,
    ];

    setOptimisticGoals(reorderedAll);

    try {
      await reorderGoalsMutation({ variables: { goalIds: reorderedActive.map((g) => g.id) } });
      await refetchGoals();
    } catch (error) {
      setOptimisticGoals(null);
      await refetchGoals();
      showToast(error instanceof Error ? error.message : "Failed to reorder goals", "red");
    }
  };

  return {
    goals,
    activeGoals,
    completedGoals,
    isLoadingGoals,
    goalsError,
    refetchGoals,
    createGoal,
    editGoal,
    deleteGoal,
    completeGoal,
    reorderGoals,
  };
};
