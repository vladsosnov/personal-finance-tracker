import { useMemo, useEffect, useState } from "react";
import { IconPencil, IconTrash, IconClockHour4 } from "@tabler/icons-react";
import { Badge, Button, Group, Pagination, Stack, Table, Text, Tooltip } from "@mantine/core";
import type { GoalOperation } from "@/features/dashboard/types";
import { formatDay } from "@/shared/utils/date";
import { formatMoney } from "@/shared/utils/number";

const OPERATIONS_PER_PAGE = 10;

type GoalOperationsTableProps = {
  operations: GoalOperation[];
  deletingOperationId: string | null;
  onEdit: (operationId: string) => void;
  onDelete: (operationId: string) => void;
};

export const GoalOperationsTable = ({
  operations,
  deletingOperationId,
  onEdit,
  onDelete,
}: GoalOperationsTableProps) => {
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

  return (
    <>
      <Table.ScrollContainer minWidth={480}>
      <Table striped highlightOnHover aria-label="Goal operations">
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={{ minWidth: 112 }}>Date</Table.Th>
            <Table.Th style={{ minWidth: 112 }}>Type</Table.Th>
            <Table.Th style={{ minWidth: 90 }}>Amount</Table.Th>
            <Table.Th>Note</Table.Th>
            <Table.Th ta="right" style={{ minWidth: 88 }}>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {paginatedOperations.map((operation) => (
            <Table.Tr key={operation.id}>
              <Table.Td style={{ minWidth: 112 }}>{formatDay(operation.operationDate)}</Table.Td>
              <Table.Td style={{ minWidth: 112 }}>
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
                    styles={{ root: { minHeight: 28, backgroundColor: "rgba(15, 23, 42, 0.06)", color: "var(--mantine-color-text)" } }}
                    aria-label={`Edit ${operation.type.toLowerCase()} operation for ${formatMoney(operation.amount)} on ${formatDay(operation.operationDate)}`}
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
                    aria-label={`Delete ${operation.type.toLowerCase()} operation for ${formatMoney(operation.amount)} on ${formatDay(operation.operationDate)}`}
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
                <Stack align="center" gap={6} py="lg">
                  <IconClockHour4 size={32} stroke={1.5} color="var(--mantine-color-dimmed)" />
                  <Text c="dimmed" size="sm">No operations yet. Add your first one!</Text>
                </Stack>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
      </Table.ScrollContainer>
      {operations.length > OPERATIONS_PER_PAGE && (
        <Group justify="space-between" align="center">
          <Text size="sm" c="dimmed">
            Showing {(page - 1) * OPERATIONS_PER_PAGE + 1}–
            {Math.min(page * OPERATIONS_PER_PAGE, operations.length)} of {operations.length}
          </Text>
          <Pagination total={totalPages} value={page} onChange={setPage} size="sm" />
        </Group>
      )}
    </>
  );
};
