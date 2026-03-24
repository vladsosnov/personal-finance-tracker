import { useQuery, useMutation } from "@apollo/client/react";
import {
  DELETE_GOAL_OPERATION,
  EDIT_GOAL_OPERATION,
  GET_GOAL_DETAILS,
  GET_GOALS,
  UPDATE_GOAL_PROGRESS,
} from "@/features/dashboard/gql/dashboard";
import type { Goal, GoalDetails } from "@/features/dashboard/types";
import type { OperationType } from "@/shared/gql/__generated__/schema-types";
import { showToast } from "@/shared/lib/toast-store";

export const useGoalDetails = (selectedGoalId: string | null) => {
  const {
    data: goalDetailsData,
    previousData: previousGoalDetailsData,
    loading: isLoadingGoalDetails,
    error: goalDetailsError,
    refetch: refetchGoalDetails,
  } = useQuery<{ goal: GoalDetails | null }>(GET_GOAL_DETAILS, {
    variables: { id: selectedGoalId },
    skip: !selectedGoalId,
  });

  const selectedGoal =
    goalDetailsData?.goal?.id === selectedGoalId
      ? goalDetailsData.goal
      : previousGoalDetailsData?.goal?.id === selectedGoalId
        ? previousGoalDetailsData.goal
        : null;

  const [updateGoalProgressMutation, { loading: isUpdatingProgress }] =
    useMutation(UPDATE_GOAL_PROGRESS);
  const [editGoalOperationMutation, { loading: isEditingOperation }] =
    useMutation(EDIT_GOAL_OPERATION);
  const [deleteGoalOperationMutation] = useMutation(DELETE_GOAL_OPERATION);

  const addOperation = async (input: {
    goalId: string;
    type: OperationType;
    amount: number;
    note?: string;
    operationDate: string;
  }): Promise<GoalDetails | null> => {
    try {
      const result = await updateGoalProgressMutation({ variables: input });
      await refetchGoalDetails();
      return (
        (result.data as { updateGoalProgress?: GoalDetails } | undefined)
          ?.updateGoalProgress ?? null
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to save operation", "red");
      throw error;
    }
  };

  const editOperation = async (input: {
    operationId: string;
    type: OperationType;
    amount: number;
    note?: string;
    operationDate: string;
  }): Promise<GoalDetails | null> => {
    try {
      const result = await editGoalOperationMutation({ variables: input });
      await refetchGoalDetails();
      return (
        (result.data as { editGoalOperation?: GoalDetails } | undefined)
          ?.editGoalOperation ?? null
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to save operation", "red");
      throw error;
    }
  };

  const deleteOperation = async (operationId: string) => {
    try {
      await deleteGoalOperationMutation({
        variables: { operationId },
        update: (cache, result) => {
          const updatedGoal = (
            result.data as { deleteGoalOperation?: GoalDetails } | undefined
          )?.deleteGoalOperation;
          if (!updatedGoal) return;

          cache.writeQuery({
            query: GET_GOAL_DETAILS,
            variables: { id: updatedGoal.id },
            data: { goal: updatedGoal },
          });

          const existing = cache.readQuery<{ goals: Goal[] }>({ query: GET_GOALS });
          if (existing?.goals) {
            cache.writeQuery({
              query: GET_GOALS,
              data: {
                goals: existing.goals.map((g) =>
                  g.id === updatedGoal.id
                    ? {
                        ...g,
                        title: updatedGoal.title,
                        targetAmount: updatedGoal.targetAmount,
                        initialAmount: updatedGoal.initialAmount,
                        color: updatedGoal.color,
                        sortOrder: updatedGoal.sortOrder,
                        isCompleted: updatedGoal.isCompleted,
                        completedAt: updatedGoal.completedAt,
                        currentAmount: updatedGoal.currentAmount,
                        progress: updatedGoal.progress,
                        createdAt: updatedGoal.createdAt,
                      }
                    : g
                ),
              },
            });
          }
        },
      });
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to delete operation", "red");
      throw error;
    }
  };

  return {
    selectedGoal,
    isLoadingGoalDetails,
    goalDetailsError,
    refetchGoalDetails,
    isUpdatingProgress: isUpdatingProgress || isEditingOperation,
    addOperation,
    editOperation,
    deleteOperation,
  };
};
