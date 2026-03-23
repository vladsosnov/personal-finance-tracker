"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";
import { Container, Grid, Group, Stack, Text, Title } from "@mantine/core";
import { CreateGoalForm } from "@/features/dashboard/components/create-goal-form";
import { DashboardOverviewStats } from "@/features/dashboard/components/dashboard-overview-stats";
import { DashboardSkeleton } from "@/features/dashboard/components/dashboard-skeleton";
import { GoalDetailsPanel } from "@/features/dashboard/components/goal-details-panel";
import { GoalsList } from "@/features/dashboard/components/goals-list";
import {
  CREATE_GOAL,
  DELETE_GOAL,
  DELETE_GOAL_OPERATION,
  EDIT_GOAL_OPERATION,
  GET_GOAL_DETAILS,
  GET_GOALS,
  GET_ME,
  REORDER_GOALS,
  UPDATE_GOAL_COLOR,
  UPDATE_GOAL_PROGRESS,
} from "@/features/dashboard/gql/dashboard";
import type { Goal, GoalDetails } from "@/features/dashboard/types";
import { DEFAULT_GOAL_COLOR } from "@/shared/constants/goal-colors";
import { APP_ROUTES } from "@/shared/constants/routes";
import { AUTH_TOKEN_KEY } from "@/shared/constants/storage";
import type { OperationType } from "@/shared/gql/__generated__/schema-types";
import { getTodayDateValue } from "@/shared/utils/date";

export const DashboardClient = () => {
  const router = useRouter();
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  const [goalTitle, setGoalTitle] = useState("");
  const [goalTarget, setGoalTarget] = useState<number | "">(0);
  const [goalInitialAmount, setGoalInitialAmount] = useState<number | "">(0);
  const [goalColor, setGoalColor] = useState<string>(DEFAULT_GOAL_COLOR);
  const [operationType, setOperationType] = useState<OperationType>("INCREASE");
  const [operationAmount, setOperationAmount] = useState<number | "">(0);
  const [operationNote, setOperationNote] = useState("");
  const [operationDate, setOperationDate] = useState(getTodayDateValue);
  const [editingOperationId, setEditingOperationId] = useState<string | null>(null);
  const [deletingOperationId, setDeletingOperationId] = useState<string | null>(null);
  const [isDeletingGoal, setIsDeletingGoal] = useState(false);
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
  const { data: goalsData, refetch: refetchGoals } = useQuery<{ goals: Goal[] }>(GET_GOALS, {
    skip: !isHydrated || !isAuthed,
  });
  const { data: goalDetailsData, refetch: refetchGoalDetails } = useQuery<{ goal: GoalDetails | null }>(GET_GOAL_DETAILS, {
    variables: { id: selectedGoalId },
    skip: !isHydrated || !isAuthed || !selectedGoalId,
  });

  const serverGoals = useMemo(() => goalsData?.goals ?? [], [goalsData]);

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
  const [reorderGoalsMutation] = useMutation(REORDER_GOALS);
  const [deleteGoalOperationMutation] = useMutation(DELETE_GOAL_OPERATION);
  const [editGoalOperation, { loading: isEditingOperation }] = useMutation(EDIT_GOAL_OPERATION);
  const [updateGoalColorMutation, { loading: isUpdatingGoalColor }] = useMutation(UPDATE_GOAL_COLOR);
  const [updateGoalProgress, { loading: isUpdatingProgress }] = useMutation(UPDATE_GOAL_PROGRESS);

  const goals = optimisticGoals ?? serverGoals;
  const selectedGoal = goalDetailsData?.goal ?? null;

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
    setGoalTarget(0);
    setGoalInitialAmount(0);
    setGoalColor(DEFAULT_GOAL_COLOR);
    await refetchGoals();
  };

  const resetOperationForm = () => {
    setOperationType("INCREASE");
    setOperationAmount(0);
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

  const handleUpdateGoalColor = async (color: string) => {
    if (!selectedGoalId || selectedGoal?.color === color) {
      return;
    }

    await updateGoalColorMutation({
      variables: {
        goalId: selectedGoalId,
        color,
      },
    });

    await Promise.all([refetchGoals(), refetchGoalDetails()]);
  };

  const handleDeleteOperation = async (operationId: string) => {
    setDeletingOperationId(operationId);

    try {
      await deleteGoalOperationMutation({
        variables: {
          operationId,
        },
      });

      if (editingOperationId === operationId) {
        resetOperationForm();
      }

      await Promise.all([refetchGoals(), refetchGoalDetails()]);
    } finally {
      setDeletingOperationId(null);
    }
  };

  const handleDeleteGoal = async () => {
    if (!selectedGoalId) {
      return;
    }

    setIsDeletingGoal(true);

    try {
      await deleteGoalMutation({
        variables: {
          goalId: selectedGoalId,
        },
      });

      setSelectedGoalId(null);
      resetOperationForm();
      await refetchGoals();
    } finally {
      setIsDeletingGoal(false);
    }
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
    <Container size="xl" py={40}>
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
              selectedGoalId={selectedGoalId}
              onSelectGoal={setSelectedGoalId}
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
              operationType={operationType}
              operationAmount={operationAmount}
              operationNote={operationNote}
              operationDate={operationDate}
              editingOperationId={editingOperationId}
              deletingOperationId={deletingOperationId}
              isDeletingGoal={isDeletingGoal}
              isUpdatingGoalColor={isUpdatingGoalColor}
              isUpdatingProgress={isUpdatingProgress || isEditingOperation}
              isUpdateDisabled={isUpdateDisabled}
              setOperationType={setOperationType}
              setOperationAmount={setOperationAmount}
              setOperationNote={setOperationNote}
              setOperationDate={setOperationDate}
              onUpdateGoalColor={handleUpdateGoalColor}
              onDeleteGoal={handleDeleteGoal}
              onStartEditOperation={handleStartEditOperation}
              onDeleteOperation={handleDeleteOperation}
              onCancelEditOperation={resetOperationForm}
              onUpdateProgress={handleUpdateProgress}
            />
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
};
