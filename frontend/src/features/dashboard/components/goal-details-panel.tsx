import { useState } from "react";
import { Button, Card, Group, Modal, ScrollArea, Skeleton, Stack, Title } from "@mantine/core";
import { ChartRangePicker, type ChartRange } from "@/features/dashboard/components/ChartRangePicker";
import { GoalDetailHeader } from "@/features/dashboard/components/GoalDetailHeader";
import { GoalChart } from "@/features/dashboard/components/goal-chart";
import { GoalOperationsTable } from "@/features/dashboard/components/GoalOperationsTable";
import { DeleteOperationModal } from "@/features/dashboard/components/modals/DeleteOperationModal";
import { OperationModal } from "@/features/dashboard/components/modals/OperationModal";
import type { useOperationForm } from "@/features/dashboard/hooks/useOperationForm";
import type { GoalDetails, GoalOperation } from "@/features/dashboard/types";
import { StateMessage } from "@/shared/components/state-message";

export type GoalOperationActions = {
  form: ReturnType<typeof useOperationForm>;
  deletingOperationId: string | null;
  isUpdatingProgress: boolean;
  isSubmitDisabled: boolean;
  onStartEdit: (operationId: string) => void;
  onDelete: (operationId: string) => Promise<void>;
  onSubmit: () => Promise<void>;
};

type GoalDetailsPanelProps = {
  hasGoals: boolean;
  selectedGoal: GoalDetails | null;
  isLoadingGoalDetails: boolean;
  goalDetailsErrorMessage?: string | null;
  operationActions: GoalOperationActions;
  onRetryGoalDetails?: () => void;
};

export const GoalDetailsPanel = ({
  hasGoals,
  selectedGoal,
  isLoadingGoalDetails,
  goalDetailsErrorMessage,
  operationActions,
  onRetryGoalDetails,
}: GoalDetailsPanelProps) => {
  const [isOperationModalOpen, setIsOperationModalOpen] = useState(false);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [isRangePickerOpen, setIsRangePickerOpen] = useState(false);
  const [isExpandedRangePickerOpen, setIsExpandedRangePickerOpen] = useState(false);
  const [chartRange, setChartRange] = useState<ChartRange>("all");
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
        <StateMessage
          title={hasGoals ? "Choose a goal" : "No goals yet"}
          description={
            hasGoals
              ? "Select a goal to view details, operations, and chart."
              : "Create your first goal to start tracking progress."
          }
        />
      ) : (
        <ScrollArea h={610} offsetScrollbars scrollbarSize={8}>
          <Stack gap="md" pr={4}>
            <GoalDetailHeader
              goal={selectedGoal}
              chartRange={chartRange}
              isRangePickerOpen={isRangePickerOpen}
              onToggleRangePicker={() => setIsRangePickerOpen((v) => !v)}
              onChangeRange={(value) => { setChartRange(value); setIsRangePickerOpen(false); }}
              onExpandChart={() => setIsChartModalOpen(true)}
            />

            <GoalChart operations={selectedGoal.operations} color={selectedGoal.color} range={chartRange} />

            <Group justify="space-between" align="center">
              <Title order={5}>Operations</Title>
              <Button onClick={handleOpenAddOperation} aria-label="Add operation">Add</Button>
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
                <Group justify="flex-end">
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
                  range={chartRange}
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
      <Skeleton height={240} radius="md" />
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
