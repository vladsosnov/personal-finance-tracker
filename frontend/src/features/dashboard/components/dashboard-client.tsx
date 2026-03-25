"use client";

import { useMemo, useEffect, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { Card, Grid, Stack, Tabs } from "@mantine/core";
import { PageContainer } from "@/shared/components/page-container";
import { CreateGoalForm } from "@/features/dashboard/components/create-goal-form";
import { DashboardOverviewStats } from "@/features/dashboard/components/dashboard-overview-stats";
import { GoalDetailsPanel } from "@/features/dashboard/components/goal-details-panel";
import { GoalsList } from "@/features/dashboard/components/goals-list";
import { EditGoalModal } from "@/features/dashboard/components/modals/EditGoalModal";
import { DeleteGoalModal } from "@/features/dashboard/components/modals/DeleteGoalModal";
import { CompleteGoalModal } from "@/features/dashboard/components/modals/CompleteGoalModal";
import { useGoals } from "@/features/dashboard/hooks/useGoals";
import { buildGoalFromDetails } from "@/features/dashboard/utils/goalUtils";
import { useGoalDetails } from "@/features/dashboard/hooks/useGoalDetails";
import { useGoalDrag } from "@/features/dashboard/hooks/useGoalDrag";
import { useGoalForm } from "@/features/dashboard/hooks/useGoalForm";
import { useOperationForm } from "@/features/dashboard/hooks/useOperationForm";
import { EmailVerificationBanner } from "@/features/auth/components/email-verification-banner";
import { GET_ME } from "@/shared/gql/queries";
import { getPlanByName } from "@/shared/constants/plans";
import type { Goal, GoalDetails } from "@/features/dashboard/types";
import { StateMessage } from "@/shared/components/state-message";
import { trackEvent } from "@/shared/lib/analytics";

export const DashboardClient = () => {
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [goalStatusTab, setGoalStatusTab] = useState<"active" | "completed">("active");
  const [isManageMode, setIsManageMode] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [deletingGoalTitle, setDeletingGoalTitle] = useState<string | null>(null);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  const [isDeletingGoal, setIsDeletingGoal] = useState(false);
  const [pendingCompletionGoal, setPendingCompletionGoal] = useState<Goal | null>(null);
  const [deletingOperationId, setDeletingOperationId] = useState<string | null>(null);

  const { data: meData } = useQuery<{ me: { id: string; email: string; subscription: string; emailVerified: boolean } | null }>(GET_ME);

  const {
    goals,
    activeGoals,
    completedGoals,
    isLoadingGoals,
    goalsError,
    refetchGoals,
    isCreatingGoal,
    isEditingGoal,
    isCompletingGoal,
    createGoal,
    editGoal,
    deleteGoal,
    completeGoal,
    reorderGoals,
  } = useGoals();

  const {
    selectedGoal,
    isLoadingGoalDetails,
    goalDetailsError,
    refetchGoalDetails,
    isUpdatingProgress,
    addOperation,
    editOperation,
    deleteOperation,
  } = useGoalDetails(selectedGoalId);

  const operationForm = useOperationForm();
  const createGoalForm = useGoalForm();
  const editGoalForm = useGoalForm();

  const drag = useGoalDrag(reorderGoals);

  const shouldShowGoalsSkeleton = isLoadingGoals && !goals.length;
  const shouldShowGoalDetailsSkeleton = Boolean(selectedGoalId) && isLoadingGoalDetails && !selectedGoal;

  const totalTarget = useMemo(() => activeGoals.reduce((sum, g) => sum + g.targetAmount, 0), [activeGoals]);
  const totalCurrent = useMemo(() => activeGoals.reduce((sum, g) => sum + g.currentAmount, 0), [activeGoals]);

  const plan = getPlanByName(meData?.me?.subscription ?? "Free");
  const goalLimitMessage = plan.maxGoals !== null && goals.length >= plan.maxGoals
    ? `Free plan supports up to ${plan.maxGoals} goals. Upgrade to add more.`
    : null;

  const isOperationSubmitDisabled = !selectedGoalId || !operationForm.operationAmount || Number(operationForm.operationAmount) <= 0;

  useEffect(() => {
    if (!goals.length && isManageMode) setIsManageMode(false);
  }, [goals.length, isManageMode]);

  useEffect(() => {
    if (!completedGoals.length && goalStatusTab === "completed") setGoalStatusTab("active");
  }, [completedGoals.length, goalStatusTab]);

  const maybePromptCompletion = (goal: Goal | GoalDetails | null | undefined) => {
    if (!goal || goal.isCompleted || goal.targetAmount <= 0 || goal.currentAmount < goal.targetAmount) return;
    setPendingCompletionGoal(buildGoalFromDetails(goal as GoalDetails));
  };

  const handleCreateGoal = async (input: { title: string; targetAmount: number | ""; initialAmount: number | ""; color: string }) => {
    if (!input.title.trim() || !input.targetAmount || Number(input.targetAmount) <= 0) return;
    trackEvent("add_goal_click");
    await createGoal({
      title: input.title,
      targetAmount: Number(input.targetAmount),
      initialAmount: Number(input.initialAmount || 0),
      color: input.color,
    });
  };

  const handleUpdateProgress = async () => {
    if (!operationForm.operationAmount || Number(operationForm.operationAmount) <= 0) return;

    const sharedInput = {
      type: operationForm.operationType,
      amount: Number(operationForm.operationAmount),
      note: operationForm.operationNote.trim() || undefined,
      operationDate: operationForm.operationDate,
    };

    let updatedGoal: GoalDetails | null = null;

    if (operationForm.editingOperationId) {
      updatedGoal = await editOperation({ operationId: operationForm.editingOperationId, ...sharedInput });
    } else {
      if (!selectedGoalId) return;
      updatedGoal = await addOperation({ goalId: selectedGoalId, ...sharedInput });
    }

    operationForm.reset();
    // Refetch in background so the modal can close immediately after mutation
    Promise.all([refetchGoals(), refetchGoalDetails()]).then(() => {
      maybePromptCompletion(updatedGoal);
    });
  };

  const handleStartEditGoal = (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    editGoalForm.loadFromGoal(goal);
    setEditingGoalId(goalId);
  };

  const handleConfirmEditGoal = async () => {
    if (!editingGoalId || !editGoalForm.isValid) return;
    const updatedGoal = await editGoal(editingGoalId, {
      title: editGoalForm.title,
      targetAmount: Number(editGoalForm.targetAmount),
      initialAmount: Number(editGoalForm.initialAmount || 0),
      color: editGoalForm.color,
    });
    setEditingGoalId(null);
    if (selectedGoalId === editingGoalId) await refetchGoalDetails();
    maybePromptCompletion(updatedGoal);
  };

  const handleStartDeleteGoal = (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    setDeletingGoalId(goalId);
    setDeletingGoalTitle(goal?.title ?? null);
  };

  const handleConfirmDeleteGoal = async () => {
    if (!deletingGoalId) return;
    setIsDeletingGoal(true);
    try {
      await deleteGoal(deletingGoalId);
      if (selectedGoalId === deletingGoalId) setSelectedGoalId(null);
      setDeletingGoalId(null);
      setDeletingGoalTitle(null);
      operationForm.reset();
    } finally {
      setIsDeletingGoal(false);
    }
  };

  const handleConfirmComplete = async () => {
    if (!pendingCompletionGoal) return;
    try {
      await completeGoal(pendingCompletionGoal.id);
      setPendingCompletionGoal(null);
      if (selectedGoalId === pendingCompletionGoal.id) await refetchGoalDetails();
    } catch {
      // toast shown in hook
    }
  };

  const handleDeleteOperation = async (operationId: string) => {
    setDeletingOperationId(operationId);
    try {
      await deleteOperation(operationId);
      if (operationForm.editingOperationId === operationId) operationForm.reset();
    } finally {
      setDeletingOperationId(null);
    }
  };

  const isCompletedTab = goalStatusTab === "completed";
  const visibleGoals = isCompletedTab? completedGoals : activeGoals;

  const goalsEmptyState = isCompletedTab
    ? { title: "No completed goals", description: "Completed goals will appear here once you finish one." }
    : completedGoals.length > 0
      ? { title: "No active goals", description: "Completed goals are moved to the completed tab. Add a new goal to keep tracking." }
      : { title: "No goals yet", description: "Create your first goal to start tracking progress." };

  return (
    <PageContainer>
      <Stack gap="lg">
        {meData?.me && !meData.me.emailVerified && (
          <EmailVerificationBanner emailVerified={false} />
        )}

        <DashboardOverviewStats totalTarget={totalTarget} totalCurrent={totalCurrent} />

        <CreateGoalForm
          goalTitle={createGoalForm.title}
          goalTarget={createGoalForm.targetAmount}
          goalInitialAmount={createGoalForm.initialAmount}
          goalColor={createGoalForm.color}
          isCreatingGoal={isCreatingGoal}
          isAddDisabled={!createGoalForm.isValid}
          limitMessage={goalLimitMessage}
          setGoalTitle={createGoalForm.setTitle}
          setGoalTarget={createGoalForm.setTargetAmount}
          setGoalInitialAmount={createGoalForm.setInitialAmount}
          setGoalColor={createGoalForm.setColor}
          onCreateGoal={async () => {
            await handleCreateGoal({
              title: createGoalForm.title,
              targetAmount: createGoalForm.targetAmount,
              initialAmount: createGoalForm.initialAmount,
              color: createGoalForm.color,
            });
            createGoalForm.reset();
          }}
        />

        {!shouldShowGoalsSkeleton && goalsError && !goals.length ? (
          <Card withBorder radius="md" p="xl">
            <StateMessage title="Couldn't load goals" description={goalsError.message} actionLabel="Try again" onAction={() => refetchGoals()} />
          </Card>
        ) : !shouldShowGoalsSkeleton && !goals.length ? (
          <Card withBorder radius="md" p="xl">
            <StateMessage title="No goals yet" description="Create your first goal to start tracking progress." />
          </Card>
        ) : (
          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Tabs value={goalStatusTab} onChange={(value) => setGoalStatusTab((value as "active" | "completed") ?? "active")}>
                <Tabs.List mb="sm">
                  <Tabs.Tab value="active">In progress ({activeGoals.length})</Tabs.Tab>
                  <Tabs.Tab value="completed" disabled={!completedGoals.length}>
                    Completed ({completedGoals.length})
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs>
              <GoalsList
                goals={visibleGoals}
                isLoadingGoals={shouldShowGoalsSkeleton}
                selectedGoalId={selectedGoalId}
                allowDrag={!isCompletedTab}
                errorMessage={!visibleGoals.length && goalsError ? goalsError.message : null}
                emptyState={goalsEmptyState}
                manageMode={{
                  isActive: isManageMode,
                  showToggle: true,
                  canManage: goals.length > 0,
                  onToggle: () => setIsManageMode((v) => !v),
                  onEdit: handleStartEditGoal,
                  onDelete: handleStartDeleteGoal,
                }}
                drag={isCompletedTab ? { ...drag, draggingGoalId: null, dragOverGoalId: null } : drag}
                onSelectGoal={(goalId) => {
                  const goal = goals.find((g) => g.id === goalId);
                  setSelectedGoalId(goalId);
                  setGoalStatusTab(goal?.isCompleted ? "completed" : "active");
                }}
                onRetry={refetchGoals}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 8 }}>
              <GoalDetailsPanel
                hasGoals={goals.length > 0}
                selectedGoal={selectedGoal}
                isLoadingGoalDetails={shouldShowGoalDetailsSkeleton}
                goalDetailsErrorMessage={selectedGoal ? null : goalDetailsError?.message ?? null}
                operationActions={{
                  form: operationForm,
                  deletingOperationId,
                  isUpdatingProgress,
                  isSubmitDisabled: isOperationSubmitDisabled,
                  onStartEdit: (operationId) => {
                    const op = selectedGoal?.operations.find((o) => o.id === operationId);
                    if (op) operationForm.startEdit(op);
                  },
                  onDelete: handleDeleteOperation,
                  onSubmit: handleUpdateProgress,
                }}
                onRetryGoalDetails={refetchGoalDetails}
              />
            </Grid.Col>
          </Grid>
        )}

        <EditGoalModal
          opened={Boolean(editingGoalId)}
          isLoading={isEditingGoal}
          form={editGoalForm}
          onConfirm={handleConfirmEditGoal}
          onClose={() => { if (!isEditingGoal) setEditingGoalId(null); }}
        />

        <CompleteGoalModal
          goal={pendingCompletionGoal}
          isLoading={isCompletingGoal}
          onConfirm={handleConfirmComplete}
          onClose={() => setPendingCompletionGoal(null)}
        />

        <DeleteGoalModal
          goalTitle={deletingGoalTitle}
          isLoading={isDeletingGoal}
          onConfirm={handleConfirmDeleteGoal}
          onClose={() => { if (!isDeletingGoal) { setDeletingGoalId(null); setDeletingGoalTitle(null); } }}
        />
      </Stack>
    </PageContainer>
  );
};
