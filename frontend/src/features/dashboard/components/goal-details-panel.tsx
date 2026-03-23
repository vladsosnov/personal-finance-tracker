import { useMemo, useState } from "react";
import { Badge, Button, Card, Grid, Modal, NumberInput, Progress, SegmentedControl, Stack, Table, Text, TextInput, Tooltip, Title } from "@mantine/core";
import { GoalChart } from "@/features/dashboard/components/goal-chart";
import type { GoalDetails } from "@/features/dashboard/types";
import type { OperationType } from "@/shared/gql/__generated__/schema-types";
import { formatDay } from "@/shared/utils/date";
import { hexToRgba } from "@/shared/utils/color";
import { formatMoney, getProgressPercentage, MONEY_INPUT_PROPS, numberOrZero } from "@/shared/utils/number";

const NOTE_PREVIEW_LENGTH = 30;

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4 20h4l10.5-10.5a2.12 2.12 0 0 0-3-3L5 17v3Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="m13.5 6.5 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 6V4h8v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

type GoalDetailsPanelProps = {
  selectedGoal: GoalDetails | null;
  operationType: OperationType;
  operationAmount: number | "";
  operationNote: string;
  operationDate: string;
  editingOperationId: string | null;
  deletingOperationId: string | null;
  isUpdatingProgress: boolean;
  isUpdateDisabled: boolean;
  setOperationType: (value: OperationType) => void;
  setOperationAmount: (value: number | "") => void;
  setOperationNote: (value: string) => void;
  setOperationDate: (value: string) => void;
  onStartEditOperation: (operationId: string) => void;
  onDeleteOperation: (operationId: string) => Promise<void>;
  onCancelEditOperation: () => void;
  onUpdateProgress: () => Promise<void>;
};

export const GoalDetailsPanel = ({
  selectedGoal,
  operationType,
  operationAmount,
  operationNote,
  operationDate,
  editingOperationId,
  deletingOperationId,
  isUpdatingProgress,
  isUpdateDisabled,
  setOperationType,
  setOperationAmount,
  setOperationNote,
  setOperationDate,
  onStartEditOperation,
  onDeleteOperation,
  onCancelEditOperation,
  onUpdateProgress,
}: GoalDetailsPanelProps) => {
  const [pendingDeleteOperationId, setPendingDeleteOperationId] = useState<string | null>(null);
  const pendingDeleteOperation = useMemo(
    () => selectedGoal?.operations.find((operation) => operation.id === pendingDeleteOperationId) ?? null,
    [pendingDeleteOperationId, selectedGoal]
  );

  const handleConfirmDelete = async () => {
    if (!pendingDeleteOperationId) {
      return;
    }

    try {
      await onDeleteOperation(pendingDeleteOperationId);
    } finally {
      setPendingDeleteOperationId(null);
    }
  };

  return (
    <Card withBorder radius="md" p="lg">
      {!selectedGoal ? (
        <Text c="dimmed">Select a goal card to see details, operations, and chart.</Text>
      ) : (
        <Stack gap="md">
          <Title order={4}>{selectedGoal.title}</Title>
          <Text c="dimmed">
            {formatMoney(selectedGoal.currentAmount)} / {formatMoney(selectedGoal.targetAmount)}
          </Text>
          <Progress
            value={Math.max(0, Math.min(getProgressPercentage(selectedGoal.currentAmount, selectedGoal.targetAmount), 100))}
            styles={{
              root: {
                backgroundColor: hexToRgba(selectedGoal.color, 0.14),
              },
              section: {
                backgroundColor: selectedGoal.color,
              },
            }}
          />

          <Grid>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <SegmentedControl
                mt="calc(1.5rem * var(--mantine-scale))"
                fullWidth
                data={[
                  {
                    label: <span style={{ color: "var(--mantine-color-teal-6)", fontWeight: 600 }}>Increase</span>,
                    value: "INCREASE",
                  },
                  {
                    label: <span style={{ color: "var(--mantine-color-red-6)", fontWeight: 600 }}>Decrease</span>,
                    value: "DECREASE",
                  },
                ]}
                value={operationType}
                onChange={(value) => setOperationType(value as OperationType)}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 2 }}>
              <NumberInput
                label="Amount"
                {...MONEY_INPUT_PROPS}
                value={operationAmount}
                onChange={(value) => setOperationAmount(numberOrZero(value))}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 2 }}>
              <TextInput
                label="Date"
                type="date"
                value={operationDate}
                onChange={(event) => setOperationDate(event.currentTarget.value)}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <TextInput
                label="Note"
                placeholder="Salary transfer..."
                value={operationNote}
                onChange={(event) => setOperationNote(event.currentTarget.value)}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 2 }}>
              <Stack gap="xs" mt={24}>
                <Button fullWidth onClick={onUpdateProgress} loading={isUpdatingProgress} disabled={isUpdateDisabled}>
                  {editingOperationId ? "Save" : "Update"}
                </Button>
                {editingOperationId && (
                  <Button fullWidth variant="subtle" onClick={onCancelEditOperation}>
                    Cancel
                  </Button>
                )}
              </Stack>
            </Grid.Col>
          </Grid>

          <GoalChart operations={selectedGoal.operations} color={selectedGoal.color} />

          <Title order={5}>Operations</Title>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Amount</Table.Th>
                <Table.Th>Note</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {selectedGoal.operations.map((operation) => (
                <Table.Tr key={operation.id}>
                  <Table.Td>{formatDay(operation.operationDate)}</Table.Td>
                  <Table.Td>
                    <Badge color={operation.type === "INCREASE" ? "teal" : "red"} variant="light">
                      {operation.type}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{formatMoney(operation.amount)}</Table.Td>
                  <Table.Td>
                    {operation.note ? (
                      <Tooltip label={operation.note} withArrow multiline maw={360}>
                        <Text span>
                          {operation.note.length > NOTE_PREVIEW_LENGTH
                            ? `${operation.note.slice(0, NOTE_PREVIEW_LENGTH)}...`
                            : operation.note}
                        </Text>
                      </Tooltip>
                    ) : (
                      "-"
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Stack gap={4}>
                      <Button
                        variant="subtle"
                        size="compact-sm"
                        px={8}
                        aria-label="Edit operation"
                        onClick={() => onStartEditOperation(operation.id)}
                      >
                        <EditIcon />
                      </Button>
                      <Button
                        color="red"
                        variant="subtle"
                        size="compact-sm"
                        px={8}
                        aria-label="Delete operation"
                        loading={deletingOperationId === operation.id}
                        onClick={() => setPendingDeleteOperationId(operation.id)}
                      >
                        {deletingOperationId === operation.id ? undefined : <DeleteIcon />}
                      </Button>
                    </Stack>
                  </Table.Td>
                </Table.Tr>
              ))}
              {!selectedGoal.operations.length && (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text c="dimmed">No operations yet.</Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>

          <Modal
            opened={Boolean(pendingDeleteOperationId)}
            onClose={() => {
              if (!deletingOperationId) {
                setPendingDeleteOperationId(null);
              }
            }}
            title="Delete Operation"
            centered
          >
            <Stack gap="md">
              <Text>
                {pendingDeleteOperation
                  ? `Delete this ${pendingDeleteOperation.type.toLowerCase()} operation for ${formatMoney(
                      pendingDeleteOperation.amount
                    )}?`
                  : "Delete this operation?"}
              </Text>
              <Stack gap="xs">
                <Button color="red" onClick={() => void handleConfirmDelete()} loading={Boolean(deletingOperationId)}>
                  Delete
                </Button>
                <Button
                  variant="subtle"
                  onClick={() => setPendingDeleteOperationId(null)}
                  disabled={Boolean(deletingOperationId)}
                >
                  Cancel
                </Button>
              </Stack>
            </Stack>
          </Modal>
        </Stack>
      )}
    </Card>
  );
};
