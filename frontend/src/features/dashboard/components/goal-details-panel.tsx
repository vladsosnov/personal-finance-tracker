import { useState } from "react";
import dynamic from "next/dynamic";
import { IconChartLine, IconPlus, IconTarget } from "@tabler/icons-react";
import { Button, Card, Checkbox, Group, Modal, ScrollArea, Skeleton, Stack, Text, ThemeIcon, Title, Tooltip } from "@mantine/core";
import { ChartRangePicker, type ChartRange } from "@/features/dashboard/components/ChartRangePicker";
import { GoalDetailHeader } from "@/features/dashboard/components/GoalDetailHeader";
import { GoalOperationsTable } from "@/features/dashboard/components/GoalOperationsTable";
import type { useOperationForm } from "@/features/dashboard/hooks/useOperationForm";
import type { GoalDetails, GoalOperation } from "@/features/dashboard/types";
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
  selectedGoal: GoalDetails | null;
  isLoadingGoalDetails: boolean;
  goalDetailsErrorMessage?: string | null;
  operationActions: GoalOperationActions;
  onRetryGoalDetails?: () => void;
  onCreateGoal?: () => void;
  scrollHeight?: number;
};

export const GoalDetailsPanel = ({
  hasGoals,
  selectedGoal,
  isLoadingGoalDetails,
  goalDetailsErrorMessage,
  operationActions,
  onRetryGoalDetails,
  onCreateGoal,
  scrollHeight,
}: GoalDetailsPanelProps) => {
  const [isOperationModalOpen, setIsOperationModalOpen] = useState(false);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [isRangePickerOpen, setIsRangePickerOpen] = useState(false);
  const [isExpandedRangePickerOpen, setIsExpandedRangePickerOpen] = useState(false);
  const [chartRange, setChartRange] = useState<ChartRange>("all");
  const [showTrend, setShowTrend] = useState(false);
  const [pendingDeleteOperation, setPendingDeleteOperation] = useState<GoalOperation | null>(null);

  const { form, deletingOperationId, isUpdatingProgress, isSubmitDisabled, onStartEdit, onDelete, onSubmit } =
    operationActions;

  const handleOpenAddOperation = () => {
    form.reset();
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
    <Card withBorder radius="md" p="lg">
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
        <Stack gap="md" align="center" justify="center" ta="center" py="xl">
          <ThemeIcon size={56} radius="xl" variant="light" color="teal">
            {hasGoals ? <IconChartLine size={28} /> : <IconTarget size={28} />}
          </ThemeIcon>
          <div>
            <Title order={5}>{hasGoals ? "Select a goal" : "No goals yet"}</Title>
            <Text c="dimmed" size="sm" mt={4}>
              {hasGoals
                ? "Pick a goal from the list to view its chart and operations."
                : "Create your first goal to start tracking your progress."}
            </Text>
          </div>
          {!hasGoals && onCreateGoal && (
            <Button leftSection={<IconPlus size={16} />} variant="light" color="teal" size="sm" onClick={onCreateGoal}>
              Create a goal
            </Button>
          )}
        </Stack>
      ) : (
        <ScrollArea h={scrollHeight} offsetScrollbars scrollbarSize={8}>
          <Stack gap="md" pr={4}>
            <GoalDetailHeader
              goal={selectedGoal}
              chartRange={chartRange}
              showTrend={showTrend}
              isRangePickerOpen={isRangePickerOpen}
              onToggleRangePicker={() => setIsRangePickerOpen((v) => !v)}
              onChangeRange={(value) => { setChartRange(value); setIsRangePickerOpen(false); }}
              onToggleTrend={() => setShowTrend((v) => !v)}
              onExpandChart={() => setIsChartModalOpen(true)}
            />

            <GoalChart
              operations={selectedGoal.operations}
              color={selectedGoal.color}
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
              operationNote={form.operationNote}
              operationDate={form.operationDate}
              onChangeType={form.setOperationType}
              onChangeAmount={form.setOperationAmount}
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
              title={`${selectedGoal.title} — Progress chart`}
              centered
              size="calc(100vw - 96px)"
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
