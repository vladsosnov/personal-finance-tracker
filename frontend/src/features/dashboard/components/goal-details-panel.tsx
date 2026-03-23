import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Group, Modal, NumberInput, Pagination, Popover, ScrollArea, Skeleton, Stack, Table, Text, TextInput, Tooltip, Title } from "@mantine/core";
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

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CHART_RANGE_OPTIONS = [
  { label: "All time", value: "all" },
  { label: "7D", value: "7d" },
  { label: "1M", value: "1m" },
  { label: "6M", value: "6m" },
  { label: "12M", value: "12m" },
] as const;

const OPERATIONS_PER_PAGE = 10;

type GoalDetailsPanelProps = {
  hasGoals: boolean;
  selectedGoal: GoalDetails | null;
  isLoadingGoalDetails: boolean;
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
  hasGoals,
  selectedGoal,
  isLoadingGoalDetails,
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
  const [isOperationModalOpen, setIsOperationModalOpen] = useState(false);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [isRangePickerOpen, setIsRangePickerOpen] = useState(false);
  const [isExpandedRangePickerOpen, setIsExpandedRangePickerOpen] = useState(false);
  const [chartRange, setChartRange] = useState<"all" | "7d" | "1m" | "6m" | "12m">("all");
  const [operationsPage, setOperationsPage] = useState(1);
  const pendingDeleteOperation = useMemo(
    () => selectedGoal?.operations.find((operation) => operation.id === pendingDeleteOperationId) ?? null,
    [pendingDeleteOperationId, selectedGoal]
  );
  const totalOperationPages = Math.max(1, Math.ceil((selectedGoal?.operations.length ?? 0) / OPERATIONS_PER_PAGE));
  const paginatedOperations = useMemo(() => {
    if (!selectedGoal) {
      return [];
    }

    const startIndex = (operationsPage - 1) * OPERATIONS_PER_PAGE;
    return selectedGoal.operations.slice(startIndex, startIndex + OPERATIONS_PER_PAGE);
  }, [operationsPage, selectedGoal]);

  useEffect(() => {
    if (editingOperationId) {
      setIsOperationModalOpen(true);
    }
  }, [editingOperationId]);

  useEffect(() => {
    setOperationsPage(1);
  }, [selectedGoal?.id]);

  useEffect(() => {
    if (operationsPage > totalOperationPages) {
      setOperationsPage(totalOperationPages);
    }
  }, [operationsPage, totalOperationPages]);

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
        hasGoals ? (
          <Card withBorder radius="md" p="xl">
            <Stack gap={6} align="center">
              <Title order={5}>Choose a goal</Title>
              <Text c="dimmed" ta="center">
                Select a goal to view details, operations, and chart.
              </Text>
            </Stack>
          </Card>
        ) : (
          <Card withBorder radius="md" p="xl">
            <Stack gap={6} align="center">
              <Title order={5}>No goals yet</Title>
              <Text c="dimmed" ta="center">
                Create your first goal to start tracking progress.
              </Text>
            </Stack>
          </Card>
        )
      ) : (
        <ScrollArea h={610} offsetScrollbars scrollbarSize={8}>
          <Stack gap="md" pr={4}>
          <Group justify="space-between" align="flex-start">
            <Stack gap={4}>
              <Title order={4}>{selectedGoal.title}</Title>
              {selectedGoal.isCompleted && (
                <Group gap="xs">
                  <Badge color="teal" variant="light">
                    Completed
                  </Badge>
                  {selectedGoal.completedAt && (
                    <Text size="sm" c="dimmed">
                      {formatDay(selectedGoal.completedAt.slice(0, 10))}
                    </Text>
                  )}
                </Group>
              )}
            </Stack>
            <Group gap="xs" wrap="nowrap">
              <Popover opened={isRangePickerOpen} onChange={setIsRangePickerOpen} position="bottom-end" withArrow shadow="md">
                <Popover.Target>
                  <Button variant="subtle" rightSection={<ChevronDownIcon />} onClick={() => setIsRangePickerOpen((current) => !current)}>
                    {CHART_RANGE_OPTIONS.find((option) => option.value === chartRange)?.label ?? "All time"}
                  </Button>
                </Popover.Target>
                <Popover.Dropdown p="xs">
                  <Stack gap={4}>
                    {CHART_RANGE_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        variant={chartRange === option.value ? "light" : "subtle"}
                        justify="flex-start"
                        onClick={() => {
                          setChartRange(option.value);
                          setIsRangePickerOpen(false);
                        }}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </Stack>
                </Popover.Dropdown>
              </Popover>
              <Button variant="light" px={10} aria-label="Expand chart" onClick={() => setIsChartModalOpen(true)}>
                <ExpandIcon />
              </Button>
            </Group>
          </Group>

          <Stack gap="xs">
            <GoalChart operations={selectedGoal.operations} color={selectedGoal.color} range={chartRange} />
          </Stack>

          <Group justify="space-between" align="center">
            <Title order={5}>Operations</Title>
            <Button onClick={handleOpenCreateOperationModal}>Add</Button>
          </Group>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Amount</Table.Th>
                <Table.Th>Note</Table.Th>
                <Table.Th ta="right">Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paginatedOperations.map((operation) => (
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
                    <Group gap={4} wrap="nowrap" justify="flex-end">
                      <Button
                        variant="light"
                        size="compact-sm"
                        px={8}
                        styles={{
                          root: {
                            minHeight: 28,
                            backgroundColor: "rgba(15, 23, 42, 0.06)",
                            color: "var(--mantine-color-text)",
                          },
                        }}
                        aria-label="Edit operation"
                        onClick={() => onStartEditOperation(operation.id)}
                      >
                        <EditIcon />
                      </Button>
                      <Button
                        color="red"
                        variant="light"
                        size="compact-sm"
                        px={8}
                        styles={{
                          root: {
                            minHeight: 28,
                          },
                        }}
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
          {selectedGoal.operations.length > OPERATIONS_PER_PAGE && (
            <Group justify="space-between" align="center">
              <Text size="sm" c="dimmed">
                Showing {(operationsPage - 1) * OPERATIONS_PER_PAGE + 1}-
                {Math.min(operationsPage * OPERATIONS_PER_PAGE, selectedGoal.operations.length)} of {selectedGoal.operations.length}
              </Text>
              <Pagination total={totalOperationPages} value={operationsPage} onChange={setOperationsPage} size="sm" />
            </Group>
          )}

          <Modal
            opened={isOperationModalOpen}
            onClose={handleCloseOperationModal}
            title={editingOperationId ? "Edit" : "Add"}
            centered
          >
            <Stack gap="md">
              <Group gap="xs" wrap="nowrap">
                <Button
                  fullWidth
                  color="teal"
                  variant={operationType === "INCREASE" ? "light" : "subtle"}
                  onClick={() => setOperationType("INCREASE")}
                >
                  Increase
                </Button>
                <Button
                  fullWidth
                  color="red"
                  variant={operationType === "DECREASE" ? "light" : "subtle"}
                  onClick={() => setOperationType("DECREASE")}
                >
                  Decrease
                </Button>
              </Group>
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
                <Button onClick={() => handleSubmitOperation()} loading={isUpdatingProgress} disabled={isUpdateDisabled}>
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
                <Button color="red" onClick={() => handleConfirmDelete()} loading={Boolean(deletingOperationId)}>
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

          <Modal opened={isChartModalOpen} onClose={() => setIsChartModalOpen(false)} title="Progress" centered size="calc(100vw - 96px)">
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <div />
                <Popover opened={isExpandedRangePickerOpen} onChange={setIsExpandedRangePickerOpen} position="bottom-end" withArrow shadow="md">
                  <Popover.Target>
                    <Button
                      variant="subtle"
                      rightSection={<ChevronDownIcon />}
                      onClick={() => setIsExpandedRangePickerOpen((current) => !current)}
                    >
                      {CHART_RANGE_OPTIONS.find((option) => option.value === chartRange)?.label ?? "All time"}
                    </Button>
                  </Popover.Target>
                  <Popover.Dropdown p="xs">
                    <Stack gap={4}>
                      {CHART_RANGE_OPTIONS.map((option) => (
                        <Button
                          key={option.value}
                          variant={chartRange === option.value ? "light" : "subtle"}
                          justify="flex-start"
                          onClick={() => {
                            setChartRange(option.value);
                            setIsExpandedRangePickerOpen(false);
                          }}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </Stack>
                  </Popover.Dropdown>
                </Popover>
              </Group>
              <GoalChart operations={selectedGoal.operations} color={selectedGoal.color} range={chartRange} height={520} />
            </Stack>
          </Modal>

        </Stack>
        </ScrollArea>
      )}
    </Card>
  );
};
