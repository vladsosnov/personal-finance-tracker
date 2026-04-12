"use client";

import { useMemo, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@apollo/client/react";
import { Button, Card, Grid, Stack } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { IconPlus } from "@tabler/icons-react";
import { IconAlertTriangle, IconCircleCheck, IconTarget, IconTrophy } from "@tabler/icons-react";
import { PageContainer } from "@/shared/components/page-container";
import { CreateGoalForm, CreateGoalModal } from "@/features/dashboard/components/create-goal-form";
import { DashboardOverviewStats } from "@/features/dashboard/components/dashboard-overview-stats";
import { GoalDetailsPanel } from "@/features/dashboard/components/goal-details-panel";
import { GoalDetailsDrawer } from "@/features/dashboard/components/GoalDetailsDrawer";
import { GoalsSection } from "@/features/dashboard/components/GoalsSection";
import { useGoals } from "@/features/dashboard/hooks/useGoals";
import { useGoalDetails } from "@/features/dashboard/hooks/useGoalDetails";
import { useGoalDrag } from "@/features/dashboard/hooks/useGoalDrag";
import { useGoalForm } from "@/features/dashboard/hooks/useGoalForm";
import { useOperationForm } from "@/features/dashboard/hooks/useOperationForm";
import { useDashboardActions } from "@/features/dashboard/hooks/useDashboardActions";
import { EmailVerificationBanner } from "@/features/auth/components/email-verification-banner";
import { GET_ME, type MeQueryData } from "@/shared/gql/queries";
import { getPlanByName } from "@/shared/constants/plans";
import { GET_EXCHANGE_RATES } from "@/features/profile/gql/currency";
import { StateMessage } from "@/shared/components/state-message";
import { tokenStorage } from "@/shared/lib/token-storage";
import anim from "@/shared/styles/page-animations.module.css";

const EditGoalModal = dynamic(() => import("@/features/dashboard/components/modals/EditGoalModal").then(mod => ({ default: mod.EditGoalModal })), { ssr: false });
const DeleteGoalModal = dynamic(() => import("@/features/dashboard/components/modals/DeleteGoalModal").then(mod => ({ default: mod.DeleteGoalModal })), { ssr: false });
const CompleteGoalModal = dynamic(() => import("@/features/dashboard/components/modals/CompleteGoalModal").then(mod => ({ default: mod.CompleteGoalModal })), { ssr: false });

export const DashboardClient = () => {
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [goalStatusTab, setGoalStatusTab] = useState<"active" | "completed">("active");
  const [isManageMode, setIsManageMode] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);

  const isMobile = useMediaQuery("(max-width: 768px)");

  const { data: meData } = useQuery<MeQueryData>(GET_ME);

  const userCurrency = meData?.me?.primaryCurrency ?? "USD";

  const goalsApi = useGoals();
  const { goals, activeGoals, completedGoals, isLoadingGoals, goalsError } = goalsApi;

  const detailsApi = useGoalDetails(selectedGoalId);
  const { selectedGoal, isLoadingGoalDetails, goalDetailsError } = detailsApi;

  const operationForm = useOperationForm(userCurrency);
  const createGoalForm = useGoalForm(userCurrency);
  const editGoalForm = useGoalForm(userCurrency);
  const drag = useGoalDrag(goalsApi.reorderGoals);

  const actions = useDashboardActions({
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
  });

  const shouldShowGoalsSkeleton = isLoadingGoals && !goals.length;
  const shouldShowGoalDetailsSkeleton = Boolean(selectedGoalId) && isLoadingGoalDetails && !selectedGoal;

  // Fetch exchange rates for dashboard totals when goals use multiple currencies
  const needsRates = useMemo(() => activeGoals.some((g) => g.currency !== userCurrency), [activeGoals, userCurrency]);
  const { data: ratesData } = useQuery<{ exchangeRates: { base: string; rates: string } }>(
    GET_EXCHANGE_RATES,
    { variables: { base: userCurrency }, skip: !needsRates }
  );
  const rates = useMemo<Record<string, number>>(() => {
    if (!ratesData?.exchangeRates?.rates) return {};
    try { return JSON.parse(ratesData.exchangeRates.rates); } catch { return {}; }
  }, [ratesData]);

  const ratesReady = !needsRates || Object.keys(rates).length > 0;

  const convertToUserCurrency = (amount: number, fromCurrency: string) => {
    if (fromCurrency === userCurrency) return amount;
    const rate = rates[fromCurrency];
    if (!rate) return amount;
    return amount / rate;
  };

  const totalTarget = useMemo(() => ratesReady ? activeGoals.reduce((sum, g) => sum + convertToUserCurrency(g.targetAmount, g.currency), 0) : null, [activeGoals, rates, userCurrency, ratesReady]);
  const totalCurrent = useMemo(() => ratesReady ? activeGoals.reduce((sum, g) => sum + convertToUserCurrency(g.currentAmount, g.currency), 0) : null, [activeGoals, rates, userCurrency, ratesReady]);

  const plan = getPlanByName(meData?.me?.subscription ?? "Free");
  const goalLimitMessage = plan.maxGoals !== null && goals.length >= plan.maxGoals
    ? `Free plan supports up to ${plan.maxGoals} goals. Upgrade to add more.`
    : null;

  const isOperationSubmitDisabled = !selectedGoalId || !operationForm.operationAmount || Number(operationForm.operationAmount) <= 0;

  // Pick up tokens passed as URL params after Google OAuth redirect on mobile
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const access = params.get("access_token");
    const refresh = params.get("refresh_token");
    if (access && refresh) {
      tokenStorage.set(access, refresh);
      const url = new URL(window.location.href);
      url.searchParams.delete("access_token");
      url.searchParams.delete("refresh_token");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  useEffect(() => {
    if (!goals.length && isManageMode) setIsManageMode(false);
  }, [goals.length, isManageMode]);

  useEffect(() => {
    if (!completedGoals.length && goalStatusTab === "completed") setGoalStatusTab("active");
  }, [completedGoals.length, goalStatusTab]);

  useEffect(() => {
    if (!isMobile) setIsDetailsDrawerOpen(false);
  }, [isMobile]);

  const isCompletedTab = goalStatusTab === "completed";
  const visibleGoals = isCompletedTab ? completedGoals : activeGoals;

  const goalsEmptyState = isCompletedTab
    ? { title: "No completed goals", description: "Completed goals will appear here once you finish one.", icon: <IconTrophy size={24} />, iconColor: "yellow" }
    : completedGoals.length > 0
      ? { title: "No active goals", description: "Completed goals are moved to the completed tab. Add a new goal to keep tracking.", icon: <IconCircleCheck size={24} />, iconColor: "teal" }
      : { title: "No goals yet", description: "Create your first goal to start tracking progress.", icon: <IconTarget size={24} /> };

  const createGoalFormProps = {
    goalTitle: createGoalForm.title,
    goalTarget: createGoalForm.targetAmount,
    goalInitialAmount: createGoalForm.initialAmount,
    goalColor: createGoalForm.color,
    goalCurrency: createGoalForm.currency,
    isCreatingGoal: false,
    isAddDisabled: !createGoalForm.isValid,
    limitMessage: goalLimitMessage,
    setGoalTitle: createGoalForm.setTitle,
    setGoalTarget: createGoalForm.setTargetAmount,
    setGoalInitialAmount: createGoalForm.setInitialAmount,
    setGoalColor: createGoalForm.setColor,
    setGoalCurrency: createGoalForm.setCurrency,
    onCreateGoal: async () => {
      await actions.handleCreateGoal({
        title: createGoalForm.title,
        targetAmount: createGoalForm.targetAmount,
        initialAmount: createGoalForm.initialAmount,
        color: createGoalForm.color,
        currency: createGoalForm.currency,
      });
      createGoalForm.reset();
      setIsCreateModalOpen(false);
    },
  };

  const goalDetailsPanelProps = {
    hasGoals: goals.length > 0,
    selectedGoal,
    isLoadingGoalDetails: shouldShowGoalDetailsSkeleton,
    goalDetailsErrorMessage: selectedGoal ? null : goalDetailsError?.message ?? null,
    onCreateGoal: isMobile ? () => setIsCreateModalOpen(true) : undefined,
    goalCurrency: selectedGoal?.currency ?? userCurrency,
    operationActions: {
      form: operationForm,
      deletingOperationId: actions.deletingOperationId,
      isUpdatingProgress: false,
      isSubmitDisabled: isOperationSubmitDisabled,
      onStartEdit: (operationId: string) => {
        const op = selectedGoal?.operations.find((o) => o.id === operationId);
        if (op) operationForm.startEdit(op);
      },
      onDelete: actions.handleDeleteOperation,
      onSubmit: actions.handleUpdateProgress,
    },
    onRetryGoalDetails: detailsApi.refetchGoalDetails,
  };

  const goalsSectionProps = {
    activeGoals,
    completedGoals,
    visibleGoals,
    isLoadingGoals: shouldShowGoalsSkeleton,
    selectedGoalId,
    goalStatusTab,
    goalsError,
    emptyState: goalsEmptyState,
    manageMode: {
      isActive: isManageMode,
      showToggle: true as const,
      canManage: goals.length > 0,
      onToggle: () => setIsManageMode((v) => !v),
      onEdit: actions.handleStartEditGoal,
      onDelete: actions.handleStartDeleteGoal,
    },
    drag,
    onSelectGoal: actions.handleSelectGoal,
    onTabChange: setGoalStatusTab,
    onRetry: goalsApi.refetchGoals,
  };

  return (
    <PageContainer>
      <Stack gap="lg" className={anim.pageEnter}>
        {/* Email verification banner hidden until email sending is configured
        {meData?.me && !meData.me.emailVerified && (
          <EmailVerificationBanner emailVerified={false} />
        )} */}

        <DashboardOverviewStats totalTarget={totalTarget} totalCurrent={totalCurrent} currency={userCurrency} />

        {isMobile ? (
          <Button leftSection={<IconPlus size={16} />} onClick={() => setIsCreateModalOpen(true)} disabled={Boolean(goalLimitMessage)} className={anim.stagger4} fullWidth>
            Create a goal
          </Button>
        ) : (
          <CreateGoalForm {...createGoalFormProps} />
        )}

        {!shouldShowGoalsSkeleton && goalsError && !goals.length ? (
          <Card withBorder radius="md" p="xl">
            <StateMessage title="Couldn't load goals" description={goalsError.message} actionLabel="Try again" onAction={() => goalsApi.refetchGoals()} icon={<IconAlertTriangle size={24} />} iconColor="red" />
          </Card>
        ) : !shouldShowGoalsSkeleton && !goals.length ? (
          <Card withBorder radius="md" p="xl">
            <StateMessage title="No goals yet" description="Create your first goal to start tracking progress." icon={<IconTarget size={24} />} />
          </Card>
        ) : isMobile ? (
          <div className={anim.slideLeft}>
            <GoalsSection {...goalsSectionProps} />
          </div>
        ) : (
          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }} className={anim.slideLeft}>
              <GoalsSection {...goalsSectionProps} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 8 }} className={anim.slideRight}>
              <GoalDetailsPanel {...goalDetailsPanelProps} scrollHeight={610} />
            </Grid.Col>
          </Grid>
        )}

        <GoalDetailsDrawer opened={isDetailsDrawerOpen} onClose={() => setIsDetailsDrawerOpen(false)} panelProps={goalDetailsPanelProps} />

        <CreateGoalModal opened={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} {...createGoalFormProps} />

        <EditGoalModal
          opened={Boolean(actions.editingGoalId)}
          isLoading={false}
          form={editGoalForm}
          onConfirm={actions.handleConfirmEditGoal}
          onClose={() => actions.setEditingGoalId(null)}
        />

        <CompleteGoalModal
          goal={actions.pendingCompletionGoal}
          isLoading={false}
          onConfirm={actions.handleConfirmComplete}
          onClose={() => actions.setPendingCompletionGoal(null)}
        />

        <DeleteGoalModal
          goalTitle={actions.deletingGoalTitle}
          isLoading={actions.isDeletingGoal}
          onConfirm={actions.handleConfirmDeleteGoal}
          onClose={() => { if (!actions.isDeletingGoal) { actions.setDeletingGoalId(null); actions.setDeletingGoalTitle(null); } }}
        />
      </Stack>
    </PageContainer>
  );
};
