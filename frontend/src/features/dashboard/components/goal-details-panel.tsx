import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { IconChartLine, IconLayoutGrid, IconList, IconPlus, IconTarget } from "@tabler/icons-react";
import { useMediaQuery } from "@mantine/hooks";
import { ActionIcon, Button, Card, Checkbox, Group, Modal, ScrollArea, Skeleton, Stack, Tabs, Text, ThemeIcon, Title, Tooltip } from "@mantine/core";
import { ChartRangePicker, type ChartRange } from "@/features/dashboard/components/ChartRangePicker";
import { GoalDetailHeader } from "@/features/dashboard/components/GoalDetailHeader";
import { GoalOperationsTable } from "@/features/dashboard/components/GoalOperationsTable";
import { GoalPreviewCard } from "@/features/dashboard/components/GoalPreviewCard";
import type { useOperationForm } from "@/features/dashboard/hooks/useOperationForm";
import type { Goal, GoalDetails, GoalOperation } from "@/features/dashboard/types";
import { StateMessage } from "@/shared/components/state-message";

// Lazy load chart and modals to reduce initial bundle size
const GoalChart = dynamic(
  () => import("@/features/dashboard/components/goal-chart").then((m) => m.GoalChart),
  { ssr: false, loading: () => <Skeleton height={320} radius="md" /> }
);

const DeleteOperationModal = dynamic(
  () => import("@/features/dashboard/components/modals/DeleteOperationModal").then(mod => ({ default: mod.DeleteOperationModal })),
  { ssr: false }
);

const OperationModal = dynamic(
  () => import("@/features/dashboard/components/modals/OperationModal").then(mod => ({ default: mod.OperationModal })),
  { ssr: false }
);

export type GoalOperationActions = {
  form: ReturnType<typeof useOperationForm>;
  deletingOperationId: string | null;
  isUpdatingProgress: boolean;
  isSubmitDisabled: boolean;
  onStartEdit: (operationId: string) => void;
  onDelete: (operationId: string) => Promise<void>;
  onSubmit: () => Promise<void>;
};

export type GoalDetailsPanelProps = {
  hasGoals: boolean;
  activeGoals: Goal[];
  allGoals: Goal[];
  selectedGoal: GoalDetails | null;
  isLoadingGoalDetails: boolean;
  goalDetailsErrorMessage?: string | null;
  goalCurrency: string;
  operationActions: GoalOperationActions;
  onSelectGoal?: (goalId: string) => void;
  onClearSelection?: () => void;
  onRetryGoalDetails?: () => void;
  onCreateGoal?: () => void;
  scrollHeight?: number;
};

export const GoalDetailsPanel = ({
  hasGoals,
  activeGoals,
  allGoals,
  selectedGoal,
  isLoadingGoalDetails,
  goalDetailsErrorMessage,
  goalCurrency,
  operationActions,
  onSelectGoal,
  onClearSelection,
  onRetryGoalDetails,
  onCreateGoal,
  scrollHeight,
}: GoalDetailsPanelProps) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [isOperationModalOpen, setIsOperationModalOpen] = useState(false);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [isRangePickerOpen, setIsRangePickerOpen] = useState(false);
  const [isExpandedRangePickerOpen, setIsExpandedRangePickerOpen] = useState(false);
  const [chartRange, setChartRange] = useState<ChartRange>("all");
  const [showTrend, setShowTrend] = useState(false);
  const [pendingDeleteOperation, setPendingDeleteOperation] = useState<GoalOperation | null>(null);
  const [previewTab, setPreviewTab] = useState<"active" | "all" | "completed">("active");
  const [previewLayout, setPreviewLayout] = useState<"grid" | "list">("grid");

  const { form, deletingOperationId, isUpdatingProgress, isSubmitDisabled, onStartEdit, onDelete, onSubmit } =
    operationActions;
  const previewScrollHeight = isMobile ? 340 : 492;
  const completedGoals = useMemo(() => allGoals.filter((goal) => goal.isCompleted), [allGoals]);
  const previewGoals = useMemo(
    () => (previewTab === "all" ? allGoals : previewTab === "completed" ? completedGoals : activeGoals),
    [allGoals, activeGoals, completedGoals, previewTab]
  );
  const previewEmptyState = previewTab === "completed"
    ? {
        title: "No completed goals",
        description: "Completed goals will appear here once you finish one of your savings targets.",
      }
    : previewTab === "all"
      ? {
          title: "No goal previews available",
          description: "There are no goals to preview right now.",
        }
      : {
          title: "No active goals",
          description: "Active goals will appear here once you add or reopen one.",
        };

  const handleOpenAddOperation = () => {
    form.reset(goalCurrency);
    setIsOperationModalOpen(true);
  };

  const handleCloseOperationModal = () => {
    if (!isUpdatingProgress) {
      form.reset();
      setIsOperationModalOpen(false);
    }
  };

  const handleStartEditOperation = (operationId: string) => {
    onStartEdit(operationId);
    setIsOperationModalOpen(true);
  };

  const handleSubmitOperation = async () => {
    await onSubmit();
    setIsOperationModalOpen(false);
  };

  const handleConfirmDeleteOperation = async () => {
    if (!pendingDeleteOperation) return;
    try {
      await onDelete(pendingDeleteOperation.id);
    } finally {
      setPendingDeleteOperation(null);
    }
  };

  return (
    <Card withBorder radius="md" p={isMobile ? "xs" : "lg"} data-testid="goal-details-card">
      {isLoadingGoalDetails ? (
        <LoadingSkeleton />
      ) : goalDetailsErrorMessage ? (
        <StateMessage
          title="Couldn't load goal details"
          description={goalDetailsErrorMessage}
          actionLabel="Try again"
          onAction={onRetryGoalDetails}
        />
      ) : !selectedGoal ? (
        hasGoals && onSelectGoal ? (
          <Stack gap="md">
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <div>
                <Title order={4}>Goal previews</Title>
                <Text c="dimmed" size="sm" mt={4}>
                  Switch between active goals or all goals, then pick a preview to open its full chart and operations.
                </Text>
              </div>
              <Group gap={6} wrap="nowrap">
                <Tooltip label="Card view">
                  <ActionIcon
                    variant={previewLayout === "grid" ? "filled" : "subtle"}
                    color={previewLayout === "grid" ? "teal" : "gray"}
                    aria-label="Card view"
                    aria-pressed={previewLayout === "grid"}
                    onClick={() => setPreviewLayout("grid")}
                  >
                    <IconLayoutGrid size={18} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="List view">
                  <ActionIcon
                    variant={previewLayout === "list" ? "filled" : "subtle"}
                    color={previewLayout === "list" ? "teal" : "gray"}
                    aria-label="List view"
                    aria-pressed={previewLayout === "list"}
                    onClick={() => setPreviewLayout("list")}
                  >
                    <IconList size={18} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>

            <Tabs
              value={previewTab}
              onChange={(value) => setPreviewTab((value as "active" | "all" | "completed") ?? "active")}
            >
              <Tabs.List>
                <Tabs.Tab value="active">Active</Tabs.Tab>
                <Tabs.Tab value="all">All</Tabs.Tab>
                <Tabs.Tab value="completed">Completed</Tabs.Tab>
              </Tabs.List>
            </Tabs>

            <ScrollArea
              h={previewScrollHeight}
              offsetScrollbars={!isMobile}
              scrollbarSize={8}
              data-testid="goal-preview-scroll-area"
            >
              {previewGoals.length === 0 ? (
                previewTab === "completed" ? (
                  <div
                    data-testid="completed-goals-empty-state"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: previewScrollHeight,
                      width: "100%",
                    }}
                  >
                    <StateMessage
                      title={previewEmptyState.title}
                      description={previewEmptyState.description}
                    />
                  </div>
                ) : (
                  <StateMessage
                    title={previewEmptyState.title}
                    description={previewEmptyState.description}
                  />
                )
              ) : (
                <div
                  data-testid="goal-previews-grid"
                  style={{
                    display: "grid",
                    gap: "var(--mantine-spacing-sm)",
                    gridTemplateColumns:
                      isMobile || previewLayout === "list" ? "1fr" : "repeat(2, minmax(0, 1fr))",
                    paddingRight: isMobile ? 0 : "calc(0.25rem * var(--mantine-scale))",
                  }}
                >
                  {previewGoals.map((goal) => (
                    <GoalPreviewCard
                      key={goal.id}
                      goal={goal}
                      onSelect={onSelectGoal}
                      chart={
                        <GoalChart
                          operations={goal.operations ?? []}
                          color={goal.color}
                          currency={goal.currency}
                          targetAmount={goal.targetAmount}
                          initialAmount={goal.initialAmount}
                          currentAmount={goal.currentAmount}
                          isCompleted={goal.isCompleted}
                          range="all"
                          height={180}
                          compact
                        />
                      }
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </Stack>
        ) : (
          <Stack gap="md" align="center" justify="center" ta="center" py="xl">
            <ThemeIcon size={56} radius="xl" variant="light" color="teal">
              {hasGoals ? <IconChartLine size={28} /> : <IconTarget size={28} />}
            </ThemeIcon>
            <div>
              <Title order={5}>{hasGoals ? "Tap a goal to dive in" : "No goals yet"}</Title>
              <Text c="dimmed" size="sm" mt={4} maw={280}>
                {hasGoals
                  ? "See your progress chart, add operations, and track trends over time."
                  : "Create your first goal to start tracking your progress."}
              </Text>
            </div>
            {!hasGoals && onCreateGoal && (
              <Button leftSection={<IconPlus size={16} />} variant="light" color="teal" size="sm" onClick={onCreateGoal}>
                Create a goal
              </Button>
            )}
          </Stack>
        )
      ) : (
        <ScrollArea
          h={scrollHeight}
          offsetScrollbars={!isMobile}
          scrollbarSize={8}
          data-testid="goal-details-scroll-area"
        >
          <Stack gap="md" pr={isMobile ? 0 : 4}>
            <GoalDetailHeader
              goal={selectedGoal}
              chartRange={chartRange}
              showTrend={showTrend}
              isRangePickerOpen={isRangePickerOpen}
              onToggleRangePicker={() => setIsRangePickerOpen((v) => !v)}
              onChangeRange={(value) => { setChartRange(value); setIsRangePickerOpen(false); }}
              onToggleTrend={() => setShowTrend((v) => !v)}
              onExpandChart={() => setIsChartModalOpen(true)}
              onCloseSelection={onClearSelection}
            />

            <GoalChart
              operations={selectedGoal.operations}
              color={selectedGoal.color}
              currency={selectedGoal.currency}
              targetAmount={selectedGoal.targetAmount}
              initialAmount={selectedGoal.initialAmount}
              currentAmount={selectedGoal.currentAmount}
              isCompleted={selectedGoal.isCompleted}
              range={chartRange}
              showTrend={showTrend}
            />

            <Group justify="space-between" align="center">
              <Title order={5}>Operations</Title>
              <Tooltip label="Add operation" position="left">
                <Button leftSection={<IconPlus size={15} />} onClick={handleOpenAddOperation} aria-label="Add operation">
                  Add operation
                </Button>
              </Tooltip>
            </Group>

            <GoalOperationsTable
              operations={selectedGoal.operations}
              goalCurrency={goalCurrency}
              deletingOperationId={deletingOperationId}
              onEdit={handleStartEditOperation}
              onDelete={(id) => setPendingDeleteOperation(selectedGoal.operations.find((o) => o.id === id) ?? null)}
            />

            <OperationModal
              opened={isOperationModalOpen}
              isEditing={Boolean(form.editingOperationId)}
              isLoading={isUpdatingProgress}
              isSubmitDisabled={isSubmitDisabled}
              operationType={form.operationType}
              operationAmount={form.operationAmount}
              operationCurrency={form.operationCurrency}
              operationNote={form.operationNote}
              operationDate={form.operationDate}
              onChangeType={form.setOperationType}
              onChangeAmount={form.setOperationAmount}
              onChangeCurrency={form.setOperationCurrency}
              onChangeNote={form.setOperationNote}
              onChangeDate={form.setOperationDate}
              onSubmit={handleSubmitOperation}
              onClose={handleCloseOperationModal}
            />

            <DeleteOperationModal
              operation={pendingDeleteOperation}
              isLoading={Boolean(deletingOperationId)}
              onConfirm={handleConfirmDeleteOperation}
              onClose={() => { if (!deletingOperationId) setPendingDeleteOperation(null); }}
            />

            <Modal
              opened={isChartModalOpen}
              onClose={() => setIsChartModalOpen(false)}
              title={`${selectedGoal.title} - Progress chart`}
              centered
              fullScreen={isMobile}
              size={isMobile ? undefined : "calc(100vw - 96px)"}
            >
              <Stack gap="md">
                <Group justify="flex-end" align="center">
                  {chartRange === "all" && (
                    <Checkbox
                      checked={showTrend}
                      onChange={() => setShowTrend((v) => !v)}
                      label="Trend"
                      size="xs"
                      styles={{ label: { paddingLeft: 4 } }}
                      aria-label="Show trend line"
                    />
                  )}
                  <ChartRangePicker
                    value={chartRange}
                    opened={isExpandedRangePickerOpen}
                    onToggle={() => setIsExpandedRangePickerOpen((v) => !v)}
                    onChange={(value) => { setChartRange(value); setIsExpandedRangePickerOpen(false); }}
                  />
                </Group>
                <GoalChart
                  operations={selectedGoal.operations}
                  color={selectedGoal.color}
                  currency={selectedGoal.currency}
                  targetAmount={selectedGoal.targetAmount}
                  initialAmount={selectedGoal.initialAmount}
                  currentAmount={selectedGoal.currentAmount}
                  isCompleted={selectedGoal.isCompleted}
                  range={chartRange}
                  showTrend={showTrend}
                  height={520}
                />
              </Stack>
            </Modal>
          </Stack>
        </ScrollArea>
      )}
    </Card>
  );
};

const LoadingSkeleton = () => (
  <div role="status" aria-label="Loading goal details">
    <span className="sr-only">Loading goal details...</span>
    <Stack gap="md">
      <Skeleton height={28} width="45%" />
      <Skeleton height={286} radius="md" />
      <Group justify="space-between" align="center">
        <Skeleton height={22} width={110} />
        <Skeleton height={36} width={130} />
      </Group>
      <Stack gap="sm">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={44} radius="md" />
        ))}
      </Stack>
    </Stack>
  </div>
);
