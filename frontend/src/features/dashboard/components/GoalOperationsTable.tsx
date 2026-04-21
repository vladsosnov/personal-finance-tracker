import { useMemo, useEffect, useState } from "react";
import { IconPencil, IconTrash, IconClockHour4 } from "@tabler/icons-react";
import { ActionIcon, Badge, Button, Card, Group, Pagination, Stack, Table, Text, Tooltip } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import type { GoalOperation } from "@/features/dashboard/types";
import { formatDay } from "@/shared/utils/date";
import { formatMoney } from "@/shared/utils/number";

const OPERATIONS_PER_PAGE = 10;

type GoalOperationsTableProps = {
  operations: GoalOperation[];
  goalCurrency: string;
  deletingOperationId: string | null;
  onEdit: (operationId: string) => void;
  onDelete: (operationId: string) => void;
};

const OperationCard = ({
  operation,
  goalCurrency,
  deletingOperationId,
  onEdit,
  onDelete,
}: {
  operation: GoalOperation;
  goalCurrency: string;
  deletingOperationId: string | null;
  onEdit: () => void;
  onDelete: () => void;
}) => (
  <Card withBorder radius="md" p="sm">
    <Group justify="space-between" align="flex-start" wrap="nowrap">
      <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
        <Group gap="xs" align="center">
          <Badge color={operation.type === "INCREASE" ? "teal" : "red"} variant="light" size="sm">
            {operation.type === "INCREASE" ? "+" : "-"}
            {formatMoney(operation.amount, operation.currency)}
          </Badge>
          {operation.currency !== goalCurrency && (
            <Text size="xs" c="dimmed">({formatMoney(operation.convertedAmount, goalCurrency)})</Text>
          )}
        </Group>
        <Group gap="xs">
          <Text size="xs" c="dimmed">{formatDay(operation.operationDate)}</Text>
          {operation.note && (
            <Text size="xs" c="dimmed" lineClamp={1} style={{ flex: 1, minWidth: 0 }}>
              &middot; {operation.note}
            </Text>
          )}
        </Group>
      </Stack>
      <Group gap={6} wrap="nowrap">
        <ActionIcon
          variant="light"
          color="gray"
          size={36}
          aria-label={`Edit operation`}
          onClick={onEdit}
        >
          <IconPencil size={16} stroke={2} />
        </ActionIcon>
        <ActionIcon
          variant="light"
          color="red"
          size={36}
          aria-label={`Delete operation`}
          loading={deletingOperationId === operation.id}
          onClick={onDelete}
        >
          {deletingOperationId === operation.id ? undefined : <IconTrash size={16} stroke={2} />}
        </ActionIcon>
      </Group>
    </Group>
  </Card>
);

export const GoalOperationsTable = ({
  operations,
  goalCurrency,
  deletingOperationId,
  onEdit,
  onDelete,
}: GoalOperationsTableProps) => {
  const isMobile = useMediaQuery("(max-width: 768px)", false);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(operations.length / OPERATIONS_PER_PAGE));

  useEffect(() => {
    setPage(1);
  }, [operations.length]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedOperations = useMemo(() => {
    const start = (page - 1) * OPERATIONS_PER_PAGE;
    return operations.slice(start, start + OPERATIONS_PER_PAGE);
  }, [page, operations]);

  const emptyState = !operations.length && (
    <Stack align="center" gap={6} py="lg">
      <IconClockHour4 size={32} stroke={1.5} color="var(--mantine-color-dimmed)" />
      <Text c="dimmed" size="sm">No operations yet. Add your first one!</Text>
    </Stack>
  );

  const pagination = operations.length > OPERATIONS_PER_PAGE && (
    <Group justify="space-between" align="center">
      <Text size="sm" c="dimmed">
        Showing {(page - 1) * OPERATIONS_PER_PAGE + 1}–
        {Math.min(page * OPERATIONS_PER_PAGE, operations.length)} of {operations.length}
      </Text>
      <Pagination total={totalPages} value={page} onChange={setPage} size="sm" />
    </Group>
  );

  if (isMobile) {
    return (
      <>
        <Stack gap="xs">
          {paginatedOperations.map((operation) => (
            <OperationCard
              key={operation.id}
              operation={operation}
              goalCurrency={goalCurrency}
              deletingOperationId={deletingOperationId}
              onEdit={() => onEdit(operation.id)}
              onDelete={() => onDelete(operation.id)}
            />
          ))}
          {emptyState}
        </Stack>
        {pagination}
      </>
    );
  }

  return (
    <>
      <Table.ScrollContainer minWidth={480}>
      <Table striped highlightOnHover aria-label="Goal operations" layout="fixed">
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={{ width: 112 }}>Date</Table.Th>
            <Table.Th style={{ width: 112 }}>Type</Table.Th>
            <Table.Th style={{ width: 120 }}>Amount</Table.Th>
            <Table.Th>Note</Table.Th>
            <Table.Th ta="right" style={{ width: 88 }}>Actions</Table.Th>
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
              <Table.Td>
                {formatMoney(operation.amount, operation.currency)}
                {operation.currency !== goalCurrency && (
                  <Text span size="xs" c="dimmed"> ({formatMoney(operation.convertedAmount, goalCurrency)})</Text>
                )}
              </Table.Td>
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
                    styles={{ root: { minHeight: 28, backgroundColor: "var(--mantine-color-default-hover)", color: "var(--mantine-color-text)" } }}
                    aria-label={`Edit ${operation.type.toLowerCase()} operation for ${formatMoney(operation.amount, operation.currency)} on ${formatDay(operation.operationDate)}`}
                    onClick={() => onEdit(operation.id)}
                  >
                    <IconPencil size={16} stroke={2} />
                  </Button>
                  <Button
                    color="red"
                    variant="light"
                    size="compact-sm"
                    px={8}
                    styles={{ root: { minHeight: 28 } }}
                    aria-label={`Delete ${operation.type.toLowerCase()} operation for ${formatMoney(operation.amount, operation.currency)} on ${formatDay(operation.operationDate)}`}
                    loading={deletingOperationId === operation.id}
                    onClick={() => onDelete(operation.id)}
                  >
                    {deletingOperationId === operation.id ? undefined : <IconTrash size={16} stroke={2} />}
                  </Button>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
          {!operations.length && (
            <Table.Tr>
              <Table.Td colSpan={5}>
                {emptyState}
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
      </Table.ScrollContainer>
      {pagination}
    </>
  );
};
