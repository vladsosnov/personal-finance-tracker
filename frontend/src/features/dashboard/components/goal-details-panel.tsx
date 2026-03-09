import { Badge, Button, Card, Grid, NumberInput, Progress, SegmentedControl, Stack, Table, Text, TextInput, Tooltip, Title } from "@mantine/core";
import { GoalChart } from "@/features/dashboard/components/goal-chart";
import type { GoalDetails } from "@/features/dashboard/types";
import type { OperationType } from "@/shared/gql/__generated__/schema-types";
import { formatMoney, getProgressPercentage, MONEY_INPUT_PROPS, numberOrZero } from "@/shared/utils/number";

const NOTE_PREVIEW_LENGTH = 30;

type GoalDetailsPanelProps = {
  selectedGoal: GoalDetails | null;
  operationType: OperationType;
  operationAmount: number | "";
  operationNote: string;
  isUpdatingProgress: boolean;
  isUpdateDisabled: boolean;
  setOperationType: (value: OperationType) => void;
  setOperationAmount: (value: number | "") => void;
  setOperationNote: (value: string) => void;
  onUpdateProgress: () => Promise<void>;
};

export const GoalDetailsPanel = ({
  selectedGoal,
  operationType,
  operationAmount,
  operationNote,
  isUpdatingProgress,
  isUpdateDisabled,
  setOperationType,
  setOperationAmount,
  setOperationNote,
  onUpdateProgress,
}: GoalDetailsPanelProps) => {
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
            <Grid.Col span={{ base: 12, md: 3 }}>
              <NumberInput
                label="Amount"
                {...MONEY_INPUT_PROPS}
                value={operationAmount}
                onChange={(value) => setOperationAmount(numberOrZero(value))}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <TextInput
                label="Note"
                placeholder="Salary transfer..."
                value={operationNote}
                onChange={(event) => setOperationNote(event.currentTarget.value)}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 2 }}>
              <Button fullWidth mt={24} onClick={onUpdateProgress} loading={isUpdatingProgress} disabled={isUpdateDisabled}>
                Update
              </Button>
            </Grid.Col>
          </Grid>

          <GoalChart operations={selectedGoal.operations} />

          <Title order={5}>Operations</Title>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Amount</Table.Th>
                <Table.Th>Note</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {selectedGoal.operations.map((operation) => (
                <Table.Tr key={operation.id}>
                  <Table.Td>{new Date(operation.createdAt).toLocaleString()}</Table.Td>
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
                </Table.Tr>
              ))}
              {!selectedGoal.operations.length && (
                <Table.Tr>
                  <Table.Td colSpan={4}>
                    <Text c="dimmed">No operations yet.</Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Stack>
      )}
    </Card>
  );
};
