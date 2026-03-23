"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";
import { Button, Container, Grid, Group, Modal, NumberInput, Stack, Text, TextInput, Title } from "@mantine/core";
import { CreateGoalForm } from "@/features/dashboard/components/create-goal-form";
import { DashboardOverviewStats } from "@/features/dashboard/components/dashboard-overview-stats";
import { DashboardSkeleton } from "@/features/dashboard/components/dashboard-skeleton";
import { GoalColorPicker } from "@/features/dashboard/components/goal-color-picker";
import { GoalDetailsPanel } from "@/features/dashboard/components/goal-details-panel";
import { GoalsList } from "@/features/dashboard/components/goals-list";
import {
  CREATE_GOAL,
  DELETE_GOAL,
  DELETE_GOAL_OPERATION,
  EDIT_GOAL,
  EDIT_GOAL_OPERATION,
  GET_GOAL_DETAILS,
  GET_GOALS,
  GET_ME,
  REORDER_GOALS,
  UPDATE_GOAL_PROGRESS,
} from "@/features/dashboard/gql/dashboard";
import type { Goal, GoalDetails } from "@/features/dashboard/types";
import { DEFAULT_GOAL_COLOR } from "@/shared/constants/goal-colors";
import { APP_ROUTES } from "@/shared/constants/routes";
import { AUTH_TOKEN_KEY } from "@/shared/constants/storage";
import type { OperationType } from "@/shared/gql/__generated__/schema-types";
import { getTodayDateValue } from "@/shared/utils/date";
import { MONEY_INPUT_PROPS, numberOrZero } from "@/shared/utils/number";

export const DashboardClient = () => {
  const router = useRouter();
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  const [goalTitle, setGoalTitle] = useState("");
  const [goalTarget, setGoalTarget] = useState<number | "">("");
  const [goalInitialAmount, setGoalInitialAmount] = useState<number | "">("");
  const [goalColor, setGoalColor] = useState<string>(DEFAULT_GOAL_COLOR);
  const [operationType, setOperationType] = useState<OperationType>("INCREASE");
  const [operationAmount, setOperationAmount] = useState<number | "">("");
  const [operationNote, setOperationNote] = useState("");
  const [operationDate, setOperationDate] = useState(getTodayDateValue);
  const [editingOperationId, setEditingOperationId] = useState<string | null>(null);
  const [deletingOperationId, setDeletingOperationId] = useState<string | null>(null);
  const [isManageMode, setIsManageMode] = useState(false);
  const [isDeletingGoal, setIsDeletingGoal] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  const [editedGoalTitle, setEditedGoalTitle] = useState("");
  const [editedGoalTarget, setEditedGoalTarget] = useState<number | "">("");
  const [editedGoalInitialAmount, setEditedGoalInitialAmount] = useState<number | "">("");
  const [editedGoalColor, setEditedGoalColor] = useState<string>(DEFAULT_GOAL_COLOR);
  const [draggingGoalId, setDraggingGoalId] = useState<string | null>(null);
  const [dragOverGoalId, setDragOverGoalId] = useState<string | null>(null);
  const [optimisticGoals, setOptimisticGoals] = useState<Goal[] | null>(null);

  useEffect(() => {
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    setIsAuthed(Boolean(token));
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && !isAuthed) {
      router.replace(APP_ROUTES.auth);
    }
  }, [isAuthed, isHydrated, router]);

  const { data: meData } = useQuery<{ me: { id: string; email: string } | null }>(GET_ME, {
    skip: !isHydrated || !isAuthed,
  });
  const { data: goalsData, previousData: previousGoalsData, loading: isLoadingGoals, refetch: refetchGoals } = useQuery<{ goals: Goal[] }>(
    GET_GOALS,
    {
      skip: !isHydrated || !isAuthed,
    }
  );
  const {
    data: goalDetailsData,
    previousData: previousGoalDetailsData,
    loading: isLoadingGoalDetails,
    refetch: refetchGoalDetails,
  } = useQuery<{ goal: GoalDetails | null }>(GET_GOAL_DETAILS, {
    variables: { id: selectedGoalId },
    skip: !isHydrated || !isAuthed || !selectedGoalId,
  });

  const serverGoals = useMemo(() => goalsData?.goals ?? previousGoalsData?.goals ?? [], [goalsData, previousGoalsData]);

  useEffect(() => {
    if (!optimisticGoals) {
      return;
    }

    const hasSameOrder =
      optimisticGoals.length === serverGoals.length &&
      optimisticGoals.every((goal, index) => goal.id === serverGoals[index]?.id);

    if (hasSameOrder) {
      setOptimisticGoals(null);
    }
  }, [optimisticGoals, serverGoals]);

  const [createGoal, { loading: isCreatingGoal }] = useMutation(CREATE_GOAL);
  const [deleteGoalMutation] = useMutation(DELETE_GOAL);
  const [editGoalMutation, { loading: isEditingGoal }] = useMutation(EDIT_GOAL);
  const [reorderGoalsMutation] = useMutation(REORDER_GOALS);
  const [deleteGoalOperationMutation] = useMutation(DELETE_GOAL_OPERATION);
  const [editGoalOperation, { loading: isEditingOperation }] = useMutation(EDIT_GOAL_OPERATION);
  const [updateGoalProgress, { loading: isUpdatingProgress }] = useMutation(UPDATE_GOAL_PROGRESS);

  const goals = optimisticGoals ?? serverGoals;
  const managingGoal = useMemo(() => goals.find((goal) => goal.id === editingGoalId) ?? null, [editingGoalId, goals]);
  const deletingGoal = useMemo(() => goals.find((goal) => goal.id === deletingGoalId) ?? null, [deletingGoalId, goals]);
  const selectedGoal =
    goalDetailsData?.goal?.id === selectedGoalId
      ? goalDetailsData.goal
      : previousGoalDetailsData?.goal?.id === selectedGoalId
        ? previousGoalDetailsData.goal
        : null;
  const shouldShowGoalsSkeleton = isLoadingGoals && !goals.length;
  const shouldShowGoalDetailsSkeleton = Boolean(selectedGoalId) && isLoadingGoalDetails && !selectedGoal;

  useEffect(() => {
    if (!goals.length && isManageMode) {
      setIsManageMode(false);
    }
  }, [goals.length, isManageMode]);

  const totalTarget = useMemo(() => goals.reduce((sum: number, goal: Goal) => sum + goal.targetAmount, 0), [goals]);
  const totalCurrent = useMemo(() => goals.reduce((sum: number, goal: Goal) => sum + goal.currentAmount, 0), [goals]);
  const isAddDisabled = !goalTitle.trim() || !goalTarget || goalTarget <= 0;
  const isUpdateDisabled = !selectedGoalId || !operationAmount || operationAmount <= 0;

  const handleCreateGoal = async () => {
    if (!goalTitle.trim() || !goalTarget || goalTarget <= 0) {
      return;
    }

    await createGoal({
      variables: {
        title: goalTitle.trim(),
        targetAmount: Number(goalTarget),
        initialAmount: Number(goalInitialAmount || 0),
        color: goalColor,
      },
    });

    setGoalTitle("");
    setGoalTarget("");
    setGoalInitialAmount("");
    setGoalColor(DEFAULT_GOAL_COLOR);
    await refetchGoals();
  };

  const resetOperationForm = () => {
    setOperationType("INCREASE");
    setOperationAmount("");
    setOperationNote("");
    setOperationDate(getTodayDateValue());
    setEditingOperationId(null);
  };

  const handleUpdateProgress = async () => {
    if (!operationAmount || operationAmount <= 0) {
      return;
    }

    if (editingOperationId) {
      await editGoalOperation({
        variables: {
          operationId: editingOperationId,
          type: operationType,
          amount: Number(operationAmount),
          note: operationNote.trim() || undefined,
          operationDate,
        },
      });
    } else {
      if (!selectedGoalId) {
        return;
      }

      await updateGoalProgress({
        variables: {
          goalId: selectedGoalId,
          type: operationType,
          amount: Number(operationAmount),
          note: operationNote.trim() || undefined,
          operationDate,
        },
      });
    }

    resetOperationForm();
    await Promise.all([refetchGoals(), refetchGoalDetails()]);
  };

  const handleStartEditOperation = (operationId: string) => {
    const operation = selectedGoal?.operations.find((item) => item.id === operationId);
    if (!operation) {
      return;
    }

    setEditingOperationId(operation.id);
    setOperationType(operation.type);
    setOperationAmount(operation.amount);
    setOperationNote(operation.note ?? "");
    setOperationDate(operation.operationDate);
  };

  const handleDeleteOperation = async (operationId: string) => {
    setDeletingOperationId(operationId);

    try {
      await deleteGoalOperationMutation({
        variables: {
          operationId,
        },
        update: (cache, result) => {
          const updatedGoal = (result.data as { deleteGoalOperation?: GoalDetails } | undefined)?.deleteGoalOperation;
          if (!updatedGoal) {
            return;
          }

          cache.writeQuery({
            query: GET_GOAL_DETAILS,
            variables: { id: updatedGoal.id },
            data: {
              goal: updatedGoal,
            },
          });

          const existingGoals = cache.readQuery<{ goals: Goal[] }>({
            query: GET_GOALS,
          });

          if (existingGoals?.goals) {
            cache.writeQuery({
              query: GET_GOALS,
              data: {
                goals: existingGoals.goals.map((goal) =>
                  goal.id === updatedGoal.id
                    ? {
                        ...goal,
                        title: updatedGoal.title,
                        targetAmount: updatedGoal.targetAmount,
                        initialAmount: updatedGoal.initialAmount,
                        color: updatedGoal.color,
                        sortOrder: updatedGoal.sortOrder,
                        currentAmount: updatedGoal.currentAmount,
                        progress: updatedGoal.progress,
                        createdAt: updatedGoal.createdAt,
                      }
                    : goal
                ),
              },
            });
          }
        },
      });

      if (editingOperationId === operationId) {
        resetOperationForm();
      }
    } finally {
      setDeletingOperationId(null);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!goalId) {
      return;
    }

    setIsDeletingGoal(true);

    try {
      await deleteGoalMutation({
        variables: {
          goalId,
        },
      });

      if (selectedGoalId === goalId) {
        setSelectedGoalId(null);
      }
      setDeletingGoalId(null);
      resetOperationForm();
      await refetchGoals();
    } finally {
      setIsDeletingGoal(false);
    }
  };

  const handleEditGoal = async (goalId: string, input: { title: string; targetAmount: number; initialAmount: number; color: string }) => {
    if (!goalId) {
      return;
    }

    await editGoalMutation({
      variables: {
        goalId,
        title: input.title,
        targetAmount: input.targetAmount,
        initialAmount: input.initialAmount,
        color: input.color,
      },
    });

    setEditingGoalId(null);

    if (selectedGoalId === goalId) {
      await Promise.all([refetchGoals(), refetchGoalDetails()]);
      return;
    }

    await refetchGoals();
  };

  const handleStartEditGoal = (goalId: string) => {
    const goal = goals.find((item) => item.id === goalId);
    if (!goal) {
      return;
    }

    setEditedGoalTitle(goal.title);
    setEditedGoalTarget(goal.targetAmount);
    setEditedGoalInitialAmount(goal.initialAmount > 0 ? goal.initialAmount : "");
    setEditedGoalColor(goal.color);
    setEditingGoalId(goal.id);
  };

  const handleConfirmEditGoal = async () => {
    if (!editingGoalId || !editedGoalTitle.trim() || !editedGoalTarget || editedGoalTarget <= 0) {
      return;
    }

    await handleEditGoal(editingGoalId, {
      title: editedGoalTitle.trim(),
      targetAmount: Number(editedGoalTarget),
      initialAmount: Number(editedGoalInitialAmount || 0),
      color: editedGoalColor,
    });
  };

  const handleDragStart = (goalId: string) => {
    setDraggingGoalId(goalId);
    setDragOverGoalId(goalId);
  };

  const handleDragOver = (goalId: string) => {
    if (!draggingGoalId || draggingGoalId === goalId) {
      return;
    }

    setDragOverGoalId(goalId);
  };

  const handleDragEnd = () => {
    setDraggingGoalId(null);
    setDragOverGoalId(null);
  };

  const handleDrop = async (goalId: string) => {
    if (!draggingGoalId || draggingGoalId === goalId) {
      handleDragEnd();
      return;
    }

    const nextGoals = [...goals];
    const fromIndex = nextGoals.findIndex((goal) => goal.id === draggingGoalId);
    const toIndex = nextGoals.findIndex((goal) => goal.id === goalId);
    if (fromIndex < 0 || toIndex < 0) {
      handleDragEnd();
      return;
    }

    const [movedGoal] = nextGoals.splice(fromIndex, 1);
    nextGoals.splice(toIndex, 0, movedGoal);
    const reorderedGoals = nextGoals.map((goal, index) => ({
      ...goal,
      sortOrder: index,
    }));

    setOptimisticGoals(reorderedGoals);
    handleDragEnd();

    try {
      await reorderGoalsMutation({
        variables: {
          goalIds: reorderedGoals.map((goal) => goal.id),
        },
      });

      await refetchGoals();
    } catch {
      setOptimisticGoals(null);
      await refetchGoals();
    }
  };

  if (!isHydrated || !isAuthed) {
    return <DashboardSkeleton />;
  }

  return (
    <Container size="xl" py={24}>
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <Stack gap={2}>
            <Title order={1}>Your Financial Goals</Title>
            <Text c="dimmed">{meData?.me?.email ?? "Authenticated user"}</Text>
          </Stack>
        </Group>

        <DashboardOverviewStats totalTarget={totalTarget} totalCurrent={totalCurrent} />

        <CreateGoalForm
          goalTitle={goalTitle}
          goalTarget={goalTarget}
          goalInitialAmount={goalInitialAmount}
          goalColor={goalColor}
          isCreatingGoal={isCreatingGoal}
          isAddDisabled={isAddDisabled}
          setGoalTitle={setGoalTitle}
          setGoalTarget={setGoalTarget}
          setGoalInitialAmount={setGoalInitialAmount}
          setGoalColor={setGoalColor}
          onCreateGoal={handleCreateGoal}
        />

        <Grid>
          <Grid.Col span={{ base: 12, md: 5 }}>
            <GoalsList
              goals={goals}
              isLoadingGoals={shouldShowGoalsSkeleton}
              selectedGoalId={selectedGoalId}
              isManageMode={isManageMode}
              onSelectGoal={setSelectedGoalId}
              onToggleManageMode={() => setIsManageMode((current) => !current)}
              onStartEditGoal={handleStartEditGoal}
              onStartDeleteGoal={setDeletingGoalId}
              draggingGoalId={draggingGoalId}
              dragOverGoalId={dragOverGoalId}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 7 }}>
            <GoalDetailsPanel
              selectedGoal={selectedGoal}
              isLoadingGoalDetails={shouldShowGoalDetailsSkeleton}
              operationType={operationType}
              operationAmount={operationAmount}
              operationNote={operationNote}
              operationDate={operationDate}
              editingOperationId={editingOperationId}
              deletingOperationId={deletingOperationId}
              isUpdatingProgress={isUpdatingProgress || isEditingOperation}
              isUpdateDisabled={isUpdateDisabled}
              setOperationType={setOperationType}
              setOperationAmount={setOperationAmount}
              setOperationNote={setOperationNote}
              setOperationDate={setOperationDate}
              onStartEditOperation={handleStartEditOperation}
              onDeleteOperation={handleDeleteOperation}
              onCancelEditOperation={resetOperationForm}
              onUpdateProgress={handleUpdateProgress}
            />
          </Grid.Col>
        </Grid>

        <Modal
          opened={Boolean(editingGoalId)}
          onClose={() => {
            if (!isEditingGoal) {
              setEditingGoalId(null);
            }
          }}
          title="Edit goal"
          centered
        >
          <Stack gap="md">
            <TextInput label="Goal title" value={editedGoalTitle} onChange={(event) => setEditedGoalTitle(event.currentTarget.value)} />
            <NumberInput
              label="Target amount"
              placeholder="25000"
              {...MONEY_INPUT_PROPS}
              value={editedGoalTarget}
              onChange={(value) => setEditedGoalTarget(numberOrZero(value))}
            />
            <NumberInput
              label="Starting amount"
              placeholder="5000"
              {...MONEY_INPUT_PROPS}
              min={0}
              value={editedGoalInitialAmount}
              onChange={(value) => setEditedGoalInitialAmount(numberOrZero(value))}
            />
            <GoalColorPicker label="Goal color" value={editedGoalColor} onChange={setEditedGoalColor} disabled={isEditingGoal} />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setEditingGoalId(null)} disabled={isEditingGoal}>
                Cancel
              </Button>
              <Button
                onClick={() => void handleConfirmEditGoal()}
                loading={isEditingGoal}
                disabled={!editedGoalTitle.trim() || !editedGoalTarget || editedGoalTarget <= 0}
              >
                Save
              </Button>
            </Group>
          </Stack>
        </Modal>

        <Modal
          opened={Boolean(deletingGoalId)}
          onClose={() => {
            if (!isDeletingGoal) {
              setDeletingGoalId(null);
            }
          }}
          title="Remove goal?"
          centered
        >
          <Stack gap="md">
            <Text>
              Remove <strong>{deletingGoal?.title ?? "this goal"}</strong> and all of its operations? This action cannot be undone.
            </Text>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setDeletingGoalId(null)} disabled={isDeletingGoal}>
                Cancel
              </Button>
              <Button color="red" onClick={() => deletingGoalId && void handleDeleteGoal(deletingGoalId)} loading={isDeletingGoal}>
                Remove
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </Container>
  );
};
