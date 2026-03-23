import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Group, Modal, NumberInput, ScrollArea, SegmentedControl, Skeleton, Stack, Table, Text, TextInput, Tooltip, Title } from "@mantine/core";
import { GoalColorPicker } from "@/features/dashboard/components/goal-color-picker";
import { GoalChart } from "@/features/dashboard/components/goal-chart";
import type { GoalDetails } from "@/features/dashboard/types";
import type { OperationType } from "@/shared/gql/__generated__/schema-types";
import { formatDay } from "@/shared/utils/date";
import { formatMoney, MONEY_INPUT_PROPS, numberOrZero } from "@/shared/utils/number";

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

const ExpandIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M15 4h5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 10 20 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 20H4v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="m4 20 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type GoalDetailsPanelProps = {
  selectedGoal: GoalDetails | null;
  isLoadingGoalDetails: boolean;
  operationType: OperationType;
  operationAmount: number | "";
  operationNote: string;
  operationDate: string;
  editingOperationId: string | null;
  deletingOperationId: string | null;
  isDeletingGoal: boolean;
  isEditingGoal: boolean;
  isUpdatingProgress: boolean;
  isUpdateDisabled: boolean;
  setOperationType: (value: OperationType) => void;
  setOperationAmount: (value: number | "") => void;
  setOperationNote: (value: string) => void;
  setOperationDate: (value: string) => void;
  onEditGoal: (input: { title: string; targetAmount: number; initialAmount: number; color: string }) => Promise<void>;
  onDeleteGoal: () => Promise<void>;
  onStartEditOperation: (operationId: string) => void;
  onDeleteOperation: (operationId: string) => Promise<void>;
  onCancelEditOperation: () => void;
  onUpdateProgress: () => Promise<void>;
};

export const GoalDetailsPanel = ({
  selectedGoal,
  isLoadingGoalDetails,
  operationType,
  operationAmount,
  operationNote,
  operationDate,
  editingOperationId,
  deletingOperationId,
  isDeletingGoal,
  isEditingGoal,
  isUpdatingProgress,
  isUpdateDisabled,
  setOperationType,
  setOperationAmount,
  setOperationNote,
  setOperationDate,
  onEditGoal,
  onDeleteGoal,
  onStartEditOperation,
  onDeleteOperation,
  onCancelEditOperation,
  onUpdateProgress,
}: GoalDetailsPanelProps) => {
  const [pendingDeleteOperationId, setPendingDeleteOperationId] = useState<string | null>(null);
  const [isDeleteGoalModalOpen, setIsDeleteGoalModalOpen] = useState(false);
  const [isEditGoalModalOpen, setIsEditGoalModalOpen] = useState(false);
  const [isOperationModalOpen, setIsOperationModalOpen] = useState(false);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [chartRange, setChartRange] = useState<"all" | "7d" | "1m" | "6m" | "12m">("all");
  const [editedGoalTitle, setEditedGoalTitle] = useState("");
  const [editedGoalTarget, setEditedGoalTarget] = useState<number | "">("");
  const [editedGoalInitialAmount, setEditedGoalInitialAmount] = useState<number | "">("");
  const [editedGoalColor, setEditedGoalColor] = useState("");
  const pendingDeleteOperation = useMemo(
    () => selectedGoal?.operations.find((operation) => operation.id === pendingDeleteOperationId) ?? null,
    [pendingDeleteOperationId, selectedGoal]
  );

  useEffect(() => {
    if (editingOperationId) {
      setIsOperationModalOpen(true);
    }
  }, [editingOperationId]);

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

  const handleConfirmGoalDelete = async () => {
    try {
      await onDeleteGoal();
    } finally {
      setIsDeleteGoalModalOpen(false);
    }
  };

  const openEditGoalModal = () => {
    if (!selectedGoal) {
      return;
    }

    setEditedGoalTitle(selectedGoal.title);
    setEditedGoalTarget(selectedGoal.targetAmount);
    setEditedGoalInitialAmount(selectedGoal.initialAmount > 0 ? selectedGoal.initialAmount : "");
    setEditedGoalColor(selectedGoal.color);
    setIsEditGoalModalOpen(true);
  };

  const handleConfirmGoalEdit = async () => {
    if (!editedGoalTitle.trim() || !editedGoalTarget || editedGoalTarget <= 0) {
      return;
    }

    await onEditGoal({
      title: editedGoalTitle.trim(),
      targetAmount: Number(editedGoalTarget),
      initialAmount: Number(editedGoalInitialAmount || 0),
      color: editedGoalColor,
    });

    setIsEditGoalModalOpen(false);
  };

  const handleOpenCreateOperationModal = () => {
    onCancelEditOperation();
    setIsOperationModalOpen(true);
  };

  const handleCloseOperationModal = () => {
    if (!isUpdatingProgress) {
      onCancelEditOperation();
      setIsOperationModalOpen(false);
    }
  };

  const handleSubmitOperation = async () => {
    await onUpdateProgress();
    setIsOperationModalOpen(false);
  };

  return (
    <Card withBorder radius="md" p="lg">
      {isLoadingGoalDetails ? (
        <Stack gap="md">
          <Skeleton height={28} width="45%" />
          <Skeleton height={240} radius="md" />
          <Group justify="space-between" align="center">
            <Skeleton height={22} width={110} />
            <Skeleton height={36} width={130} />
          </Group>
          <Stack gap="sm">
            <Skeleton height={44} radius="md" />
            <Skeleton height={44} radius="md" />
            <Skeleton height={44} radius="md" />
            <Skeleton height={44} radius="md" />
          </Stack>
        </Stack>
      ) : !selectedGoal ? (
        <Text c="dimmed">Select a goal card to see details, operations, and chart.</Text>
      ) : (
        <ScrollArea h={610} offsetScrollbars scrollbarSize={8}>
          <Stack gap="md" pr={4}>
          <Group justify="space-between" align="flex-start">
            <Title order={4}>{selectedGoal.title}</Title>
            <Group gap="xs" wrap="nowrap">
              <Button variant="light" onClick={openEditGoalModal} loading={isEditingGoal}>
                Edit
              </Button>
              <Button color="red" variant="light" onClick={() => setIsDeleteGoalModalOpen(true)} loading={isDeletingGoal}>
                Remove
              </Button>
            </Group>
          </Group>

          <Stack gap="xs">
            <Group justify="space-between" align="center">
              <Title order={5}>Progress over time</Title>
              <Group gap="xs" wrap="nowrap">
                <SegmentedControl
                  size="xs"
                  value={chartRange}
                  onChange={(value) => setChartRange(value as "all" | "7d" | "1m" | "6m" | "12m")}
                  data={[
                    { label: "All time", value: "all" },
                    { label: "7D", value: "7d" },
                    { label: "1M", value: "1m" },
                    { label: "6M", value: "6m" },
                    { label: "12M", value: "12m" },
                  ]}
                />
                <Button variant="light" px={10} aria-label="Expand chart" onClick={() => setIsChartModalOpen(true)}>
                  <ExpandIcon />
                </Button>
              </Group>
            </Group>
            <GoalChart operations={selectedGoal.operations} color={selectedGoal.color} range={chartRange} />
          </Stack>

          <Group justify="space-between" align="center">
            <Title order={5}>Operations</Title>
            <Button onClick={handleOpenCreateOperationModal}>Add operation</Button>
          </Group>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Amount</Table.Th>
                <Table.Th>Note</Table.Th>
                <Table.Th>Actions</Table.Th>
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
                        <Text
                          span
                          style={{
                            width: 280,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            wordBreak: "break-word",
                          }}
                        >
                          {operation.note}
                        </Text>
                      </Tooltip>
                    ) : (
                      "-"
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} wrap="nowrap">
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
                    </Group>
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
            opened={isOperationModalOpen}
            onClose={handleCloseOperationModal}
            title={editingOperationId ? "Edit operation" : "Add operation"}
            centered
          >
            <Stack gap="md">
              <SegmentedControl
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
              <NumberInput
                label="Amount"
                placeholder="500"
                {...MONEY_INPUT_PROPS}
                value={operationAmount}
                onChange={(value) => setOperationAmount(numberOrZero(value))}
              />
              <TextInput
                label="Date"
                type="date"
                value={operationDate}
                onChange={(event) => setOperationDate(event.currentTarget.value)}
              />
              <TextInput
                label="Note"
                placeholder="Salary transfer..."
                value={operationNote}
                onChange={(event) => setOperationNote(event.currentTarget.value)}
              />
              <Group justify="flex-end">
                <Button variant="default" onClick={handleCloseOperationModal} disabled={isUpdatingProgress}>
                  Cancel
                </Button>
                <Button onClick={() => void handleSubmitOperation()} loading={isUpdatingProgress} disabled={isUpdateDisabled}>
                  {editingOperationId ? "Save" : "Add"}
                </Button>
              </Group>
            </Stack>
          </Modal>

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

          <Modal
            opened={isEditGoalModalOpen}
            onClose={() => {
              if (!isEditingGoal) {
                setIsEditGoalModalOpen(false);
              }
            }}
            title="Edit goal"
            centered
          >
            <Stack gap="md">
              <TextInput
                label="Goal title"
                value={editedGoalTitle}
                onChange={(event) => setEditedGoalTitle(event.currentTarget.value)}
              />
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
                <Button variant="default" onClick={() => setIsEditGoalModalOpen(false)} disabled={isEditingGoal}>
                  Cancel
                </Button>
                <Button
                  onClick={() => void handleConfirmGoalEdit()}
                  loading={isEditingGoal}
                  disabled={!editedGoalTitle.trim() || !editedGoalTarget || editedGoalTarget <= 0}
                >
                  Save
                </Button>
              </Group>
            </Stack>
          </Modal>

          <Modal opened={isChartModalOpen} onClose={() => setIsChartModalOpen(false)} title="Progress over time" centered size="calc(100vw - 96px)">
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <SegmentedControl
                  value={chartRange}
                  onChange={(value) => setChartRange(value as "all" | "7d" | "1m" | "6m" | "12m")}
                  data={[
                    { label: "All time", value: "all" },
                    { label: "7D", value: "7d" },
                    { label: "1M", value: "1m" },
                    { label: "6M", value: "6m" },
                    { label: "12M", value: "12m" },
                  ]}
                />
              </Group>
              <GoalChart operations={selectedGoal.operations} color={selectedGoal.color} range={chartRange} height={520} />
            </Stack>
          </Modal>

          <Modal
            opened={isDeleteGoalModalOpen}
            onClose={() => {
              if (!isDeletingGoal) {
                setIsDeleteGoalModalOpen(false);
              }
            }}
            title="Delete goal?"
            centered
          >
            <Stack gap="md">
              <Text>
                Delete <strong>{selectedGoal.title}</strong> and all of its operations? This action cannot be undone.
              </Text>
              <Group justify="flex-end">
                <Button variant="default" onClick={() => setIsDeleteGoalModalOpen(false)} disabled={isDeletingGoal}>
                  Cancel
                </Button>
                <Button color="red" onClick={() => void handleConfirmGoalDelete()} loading={isDeletingGoal}>
                  Delete
                </Button>
              </Group>
            </Stack>
          </Modal>
          </Stack>
        </ScrollArea>
      )}
    </Card>
  );
};
