import { useState } from "react";
import { Button, Card, Group, Modal, ScrollArea, Skeleton, Stack, Title } from "@mantine/core";
import { ChartRangePicker, type ChartRange } from "@/features/dashboard/components/ChartRangePicker";
import { GoalDetailHeader } from "@/features/dashboard/components/GoalDetailHeader";
import { GoalChart } from "@/features/dashboard/components/goal-chart";
import { GoalOperationsTable } from "@/features/dashboard/components/GoalOperationsTable";
import { DeleteOperationModal } from "@/features/dashboard/components/modals/DeleteOperationModal";
import { OperationModal } from "@/features/dashboard/components/modals/OperationModal";
import type { GoalDetails, GoalOperation } from "@/features/dashboard/types";
import { StateMessage } from "@/shared/components/state-message";
import type { OperationType } from "@/shared/gql/__generated__/schema-types";

type GoalDetailsPanelProps = {
  hasGoals: boolean;
  selectedGoal: GoalDetails | null;
  isLoadingGoalDetails: boolean;
  goalDetailsErrorMessage?: string | null;
  operationType: OperationType;
  operationAmount: number | "";
  operationNote: string;
  operationDate: string;
  editingOperationId: string | null;
  deletingOperationId: string | null;
  isUpdatingProgress: boolean;
  isUpdateDisabled: boolean;
  onChangeOperationType: (value: OperationType) => void;
  onChangeOperationAmount: (value: number | "") => void;
  onChangeOperationNote: (value: string) => void;
  onChangeOperationDate: (value: string) => void;
  onStartEditOperation: (operationId: string) => void;
  onDeleteOperation: (operationId: string) => Promise<void>;
  onCancelEditOperation: () => void;
  onUpdateProgress: () => Promise<void>;
  onRetryGoalDetails?: () => void;
};

export const GoalDetailsPanel = ({
  hasGoals,
  selectedGoal,
  isLoadingGoalDetails,
  goalDetailsErrorMessage,
  operationType,
  operationAmount,
  operationNote,
  operationDate,
  editingOperationId,
  deletingOperationId,
  isUpdatingProgress,
  isUpdateDisabled,
  onChangeOperationType,
  onChangeOperationAmount,
  onChangeOperationNote,
  onChangeOperationDate,
  onStartEditOperation,
  onDeleteOperation,
  onCancelEditOperation,
  onUpdateProgress,
  onRetryGoalDetails,
}: GoalDetailsPanelProps) => {
  const [isOperationModalOpen, setIsOperationModalOpen] = useState(false);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [isRangePickerOpen, setIsRangePickerOpen] = useState(false);
  const [isExpandedRangePickerOpen, setIsExpandedRangePickerOpen] = useState(false);
  const [chartRange, setChartRange] = useState<ChartRange>("all");
  const [pendingDeleteOperation, setPendingDeleteOperation] = useState<GoalOperation | null>(null);

  const handleOpenAddOperation = () => {
    onCancelEditOperation();
    setIsOperationModalOpen(true);
  };

  const handleCloseOperationModal = () => {
    if (!isUpdatingProgress) {
      onCancelEditOperation();
      setIsOperationModalOpen(false);
    }
  };

  const handleStartEditOperation = (operationId: string) => {
    onStartEditOperation(operationId);
    setIsOperationModalOpen(true);
  };

  const handleSubmitOperation = async () => {
    await onUpdateProgress();
    setIsOperationModalOpen(false);
  };

  const handleConfirmDeleteOperation = async () => {
    if (!pendingDeleteOperation) return;
    try {
      await onDeleteOperation(pendingDeleteOperation.id);
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
              <Button onClick={handleOpenAddOperation}>Add</Button>
            </Group>

            <GoalOperationsTable
              operations={selectedGoal.operations}
              deletingOperationId={deletingOperationId}
              onEdit={handleStartEditOperation}
              onDelete={(id) => {
                const op = selectedGoal.operations.find((o) => o.id === id) ?? null;
                setPendingDeleteOperation(op);
              }}
            />

            <OperationModal
              opened={isOperationModalOpen}
              isEditing={Boolean(editingOperationId)}
              isLoading={isUpdatingProgress}
              isSubmitDisabled={isUpdateDisabled}
              operationType={operationType}
              operationAmount={operationAmount}
              operationNote={operationNote}
              operationDate={operationDate}
              onChangeType={onChangeOperationType}
              onChangeAmount={onChangeOperationAmount}
              onChangeNote={onChangeOperationNote}
              onChangeDate={onChangeOperationDate}
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
              title="Progress"
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
);
