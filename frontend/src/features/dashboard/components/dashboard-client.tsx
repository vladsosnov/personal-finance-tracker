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
import { CREATE_GOAL, GET_GOAL_DETAILS, GET_GOALS, GET_ME, UPDATE_GOAL_PROGRESS } from "@/features/dashboard/gql/dashboard";
import type { Goal, GoalDetails } from "@/features/dashboard/types";
import { APP_ROUTES } from "@/shared/constants/routes";
import { AUTH_TOKEN_KEY } from "@/shared/constants/storage";
import type { OperationType } from "@/shared/gql/__generated__/schema-types";

export const DashboardClient = () => {
  const router = useRouter();
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  const [goalTitle, setGoalTitle] = useState("");
  const [goalTarget, setGoalTarget] = useState<number | "">(0);
  const [operationType, setOperationType] = useState<OperationType>("INCREASE");
  const [operationAmount, setOperationAmount] = useState<number | "">(0);
  const [operationNote, setOperationNote] = useState("");

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

  const [createGoal, { loading: isCreatingGoal }] = useMutation(CREATE_GOAL);
  const [updateGoalProgress, { loading: isUpdatingProgress }] = useMutation(UPDATE_GOAL_PROGRESS);

  const goals = useMemo(() => goalsData?.goals ?? [], [goalsData]);
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
      },
    });

    setGoalTitle("");
    setGoalTarget(0);
    await refetchGoals();
  };

  const handleUpdateProgress = async () => {
    if (!selectedGoalId || !operationAmount || operationAmount <= 0) {
      return;
    }

    await updateGoalProgress({
      variables: {
        goalId: selectedGoalId,
        type: operationType,
        amount: Number(operationAmount),
        note: operationNote.trim() || undefined,
      },
    });

    setOperationAmount(0);
    setOperationNote("");
    await Promise.all([refetchGoals(), refetchGoalDetails()]);
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
          isCreatingGoal={isCreatingGoal}
          isAddDisabled={isAddDisabled}
          setGoalTitle={setGoalTitle}
          setGoalTarget={setGoalTarget}
          onCreateGoal={handleCreateGoal}
        />

        <Grid>
          <Grid.Col span={{ base: 12, md: 5 }}>
            <GoalsList goals={goals} selectedGoalId={selectedGoalId} onSelectGoal={setSelectedGoalId} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 7 }}>
            <GoalDetailsPanel
              selectedGoal={selectedGoal}
              operationType={operationType}
              operationAmount={operationAmount}
              operationNote={operationNote}
              isUpdatingProgress={isUpdatingProgress}
              isUpdateDisabled={isUpdateDisabled}
              setOperationType={setOperationType}
              setOperationAmount={setOperationAmount}
              setOperationNote={setOperationNote}
              onUpdateProgress={handleUpdateProgress}
            />
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
};
