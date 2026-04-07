import { useState } from "react";
import { buildGoalFromDetails } from "@/features/dashboard/utils/goalUtils";
import { trackEvent } from "@/shared/lib/analytics";
import { fireConfetti } from "@/shared/lib/confetti";
import { showToast } from "@/shared/lib/toast-store";
import type { Goal, GoalDetails } from "@/features/dashboard/types";
import type { useGoals } from "@/features/dashboard/hooks/useGoals";
import type { useGoalDetails } from "@/features/dashboard/hooks/useGoalDetails";
import type { useGoalForm } from "@/features/dashboard/hooks/useGoalForm";
import type { useOperationForm } from "@/features/dashboard/hooks/useOperationForm";

type Deps = {
  goals: Goal[];
  selectedGoalId: string | null;
  setSelectedGoalId: (id: string | null) => void;
  setGoalStatusTab: (tab: "active" | "completed") => void;
  setIsDetailsDrawerOpen: (open: boolean) => void;
  isMobile: boolean | undefined;
  goalsApi: Pick<ReturnType<typeof useGoals>, "createGoal" | "editGoal" | "deleteGoal" | "completeGoal" | "refetchGoals">;
  detailsApi: Pick<ReturnType<typeof useGoalDetails>, "selectedGoal" | "addOperation" | "editOperation" | "deleteOperation" | "refetchGoalDetails">;
  editGoalForm: ReturnType<typeof useGoalForm>;
  operationForm: ReturnType<typeof useOperationForm>;
};

export const useDashboardActions = ({
  goals,
  selectedGoalId,
  setSelectedGoalId,
  setGoalStatusTab,
  setIsDetailsDrawerOpen,
  isMobile,
  goalsApi,
  detailsApi,
  editGoalForm,
  operationForm,
}: Deps) => {
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [deletingGoalTitle, setDeletingGoalTitle] = useState<string | null>(null);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  const [isDeletingGoal, setIsDeletingGoal] = useState(false);
  const [pendingCompletionGoal, setPendingCompletionGoal] = useState<Goal | null>(null);
  const [deletingOperationId, setDeletingOperationId] = useState<string | null>(null);

  const maybePromptCompletion = (goal: Goal | GoalDetails | null | undefined) => {
    if (!goal || goal.isCompleted || goal.targetAmount <= 0 || goal.currentAmount < goal.targetAmount) return;
    setPendingCompletionGoal(buildGoalFromDetails(goal as GoalDetails));
  };

  const handleCreateGoal = async (input: { title: string; targetAmount: number | ""; initialAmount: number | ""; color: string; currency: string }) => {
    if (!input.title.trim() || (input.targetAmount !== 0 && !input.targetAmount)) return;
    trackEvent("add_goal_click");
    try {
      await goalsApi.createGoal({
        title: input.title,
        targetAmount: Number(input.targetAmount),
        initialAmount: Number(input.initialAmount || 0),
        color: input.color,
        currency: input.currency,
      });
      showToast("Goal created", "teal");
    } catch {
      // error toast already shown by useGoals
    }
  };

  const handleUpdateProgress = async () => {
    if (!operationForm.operationAmount || Number(operationForm.operationAmount) <= 0) return;

    const sharedInput = {
      type: operationForm.operationType,
      amount: Number(operationForm.operationAmount),
      currency: operationForm.operationCurrency,
      note: operationForm.operationNote.trim() || undefined,
      operationDate: operationForm.operationDate,
    };

    const isEdit = Boolean(operationForm.editingOperationId);

    try {
      let updatedGoal: GoalDetails | null = null;

      if (operationForm.editingOperationId) {
        updatedGoal = await detailsApi.editOperation({ operationId: operationForm.editingOperationId, ...sharedInput });
      } else {
        if (!selectedGoalId) return;
        trackEvent("operation_added");
        updatedGoal = await detailsApi.addOperation({ goalId: selectedGoalId, ...sharedInput });
      }

      operationForm.reset();
      showToast(isEdit ? "Operation updated" : "Operation added", "teal");
      goalsApi.refetchGoals().then(() => {
        maybePromptCompletion(updatedGoal);
      });
    } catch {
      // error toast already shown by useGoalDetails
    }
  };

  const handleStartEditGoal = (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    editGoalForm.loadFromGoal(goal);
    setEditingGoalId(goalId);
  };

  const handleConfirmEditGoal = async () => {
    if (!editingGoalId || !editGoalForm.isValid) return;
    try {
      const updatedGoal = await goalsApi.editGoal(editingGoalId, {
        title: editGoalForm.title,
        targetAmount: Number(editGoalForm.targetAmount),
        initialAmount: Number(editGoalForm.initialAmount || 0),
        color: editGoalForm.color,
        currency: editGoalForm.currency,
      });
      setEditingGoalId(null);
      if (selectedGoalId === editingGoalId) detailsApi.refetchGoalDetails();
      maybePromptCompletion(updatedGoal);
    } catch {
      // error toast already shown by useGoals
    }
  };

  const handleStartDeleteGoal = (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    setDeletingGoalId(goalId);
    setDeletingGoalTitle(goal?.title ?? null);
  };

  const handleConfirmDeleteGoal = async () => {
    if (!deletingGoalId) return;
    trackEvent("goal_deleted");
    setIsDeletingGoal(true);
    try {
      await goalsApi.deleteGoal(deletingGoalId);
      if (selectedGoalId === deletingGoalId) {
        setSelectedGoalId(null);
        setIsDetailsDrawerOpen(false);
      }
      setDeletingGoalId(null);
      setDeletingGoalTitle(null);
      operationForm.reset();
    } finally {
      setIsDeletingGoal(false);
    }
  };

  const handleConfirmComplete = async () => {
    if (!pendingCompletionGoal) return;
    const goalId = pendingCompletionGoal.id;
    try {
      await goalsApi.completeGoal(goalId);
      setPendingCompletionGoal(null);
      fireConfetti();
      showToast("Goal completed!", "teal");
      if (selectedGoalId === goalId) detailsApi.refetchGoalDetails();
    } catch {
      setPendingCompletionGoal(null);
    }
  };

  const handleDeleteOperation = async (operationId: string) => {
    trackEvent("operation_deleted");
    setDeletingOperationId(operationId);
    try {
      await detailsApi.deleteOperation(operationId);
      if (operationForm.editingOperationId === operationId) operationForm.reset();
    } finally {
      setDeletingOperationId(null);
    }
  };

  const handleSelectGoal = (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    setSelectedGoalId(goalId);
    setGoalStatusTab(goal?.isCompleted ? "completed" : "active");
    if (isMobile) setIsDetailsDrawerOpen(true);
  };

  return {
    // state exposed for modals
    editingGoalId,
    setEditingGoalId,
    deletingGoalTitle,
    setDeletingGoalTitle,
    deletingGoalId,
    setDeletingGoalId,
    isDeletingGoal,
    pendingCompletionGoal,
    setPendingCompletionGoal,
    deletingOperationId,
    // handlers
    handleCreateGoal,
    handleUpdateProgress,
    handleStartEditGoal,
    handleConfirmEditGoal,
    handleStartDeleteGoal,
    handleConfirmDeleteGoal,
    handleConfirmComplete,
    handleDeleteOperation,
    handleSelectGoal,
  };
};
