import { Button, Card, Checkbox, FileInput, Group, Progress, Stack, Table, Text, Title } from "@mantine/core";
import type { ImportProgressState, PreparedImportGoal, SkippedImportGoal } from "@/features/profile/types";

type ImportProgressCardProps = {
  file: File | null;
  preparedGoals: PreparedImportGoal[];
  skippedGoals: SkippedImportGoal[];
  importTotals: { goals: number; operations: number };
  importProgress: ImportProgressState | null;
  importProgressValue: number;
  importLimitMessage: string | null;
  isImportOverLimit: boolean;
  isPreparingImport: boolean;
  isImporting: boolean;
  includedZeroTargetGoalIndexes: number[];
  onFileChange: (file: File | null) => void;
  onImport: () => void;
  onToggleZeroTargetGoal: (sourceIndex: number, include: boolean) => void;
  onRemoveFromImport: (sourceIndex: number) => void;
};

export const ImportProgressCard = ({
  file,
  preparedGoals,
  skippedGoals,
  importTotals,
  importProgress,
  importProgressValue,
  importLimitMessage,
  isImportOverLimit,
  isPreparingImport,
  isImporting,
  includedZeroTargetGoalIndexes,
  onFileChange,
  onImport,
  onToggleZeroTargetGoal,
  onRemoveFromImport,
}: ImportProgressCardProps) => (
  <Card withBorder radius="md" p="lg">
    <Stack gap="md">
      <Stack gap={2}>
        <Title order={4}>Import progress</Title>
        <Text c="dimmed">
          This reads the exported JSON stored in a .txt file and converts history snapshots into goal operations.
        </Text>
      </Stack>

      <ImportFormatHint />

      <FileInput
        label="Progress file"
        placeholder="Choose example_of_progress.txt"
        accept=".txt,application/json,text/plain"
        value={file}
        onChange={onFileChange}
        clearable
      />

      {file && (
        <Stack gap="xs">
          {importLimitMessage && (
            <Text size="sm" c="yellow">{importLimitMessage}</Text>
          )}
          <Group>
            <Button onClick={onImport} loading={isImporting} disabled={!preparedGoals.length || isPreparingImport || isImportOverLimit}>
              Import
            </Button>
          </Group>
        </Stack>
      )}

      {importProgress && isImporting && (
        <Stack gap={6}>
          <Group justify="space-between" gap="xs">
            <Text fw={600}>Importing progress</Text>
            <Text size="sm" c="dimmed">
              {importProgress.completedSteps} / {importProgress.totalSteps}
            </Text>
          </Group>
          <Progress value={importProgressValue} animated aria-label={`Import progress: ${importProgress.completedSteps} of ${importProgress.totalSteps} steps completed`} />
          <Text size="sm" c="dimmed">{importProgress.currentLabel}</Text>
        </Stack>
      )}

      {preparedGoals.length > 0 && (
        <Stack gap="sm">
          <Text fw={600}>
            Ready to import {importTotals.goals} goals and {importTotals.operations} operations
          </Text>
          <Table striped highlightOnHover aria-label="Goals ready to import">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Goal</Table.Th>
                <Table.Th>Target</Table.Th>
                <Table.Th>Start</Table.Th>
                <Table.Th>Operations</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {preparedGoals.map((goal, i) => (
                <Table.Tr key={`${goal.title}-${i}`}>
                  <Table.Td>{goal.title}</Table.Td>
                  <Table.Td>{goal.targetAmount}</Table.Td>
                  <Table.Td>{goal.initialAmount}</Table.Td>
                  <Table.Td>{goal.operationCount}</Table.Td>
                  <Table.Td>
                    {goal.canRemoveFromImport ? (
                      <Button variant="light" color="red" size="compact-sm" aria-label={`Remove ${goal.title} from import`} onClick={() => onRemoveFromImport(goal.sourceIndex)}>
                        Remove
                      </Button>
                    ) : "-"}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      )}

      {skippedGoals.length > 0 && (
        <Stack gap="sm">
          <Text fw={600}>Skipped items</Text>
          <Table striped highlightOnHover aria-label="Skipped items">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Title</Table.Th>
                <Table.Th>Reason</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {skippedGoals.map((goal, i) => (
                <Table.Tr key={`${goal.title}-${goal.reason}-${i}`}>
                  <Table.Td>{goal.title}</Table.Td>
                  <Table.Td>{goal.reason}</Table.Td>
                  <Table.Td>
                    {goal.canInclude ? (
                      <Checkbox
                        label="Include"
                        aria-label={`Include ${goal.title} in import`}
                        checked={includedZeroTargetGoalIndexes.includes(goal.sourceIndex)}
                        onChange={(e) => onToggleZeroTargetGoal(goal.sourceIndex, e.currentTarget.checked)}
                      />
                    ) : "-"}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      )}
    </Stack>
  </Card>
);

const ImportFormatHint = () => (
  <Card withBorder radius="md" p="md" bg="var(--mantine-color-body)">
    <Stack gap="xs">
      <Text fw={600}>Expected file format</Text>
      <Text size="sm" c="dimmed">
        The file should contain a JSON array of goals. Each goal should include `title`, `targetValue`, optional `initialValue`,
        and a `history` array with `date`, `value`, and optional `note`.
      </Text>
      <Text
        component="pre"
        size="sm"
        style={{
          margin: 0,
          padding: 12,
          borderRadius: 8,
          overflowX: "auto",
          backgroundColor: "rgba(148, 163, 184, 0.08)",
          fontFamily: "var(--font-mono)",
        }}
      >
        {`[
  {
    "title": "Emergency fund",
    "targetValue": 10000,
    "initialValue": 500,
    "history": [
      { "date": "2026-01-31T10:00:00Z", "value": 1200 },
      { "date": "2026-02-28T10:00:00Z", "value": 1800, "note": "Monthly top-up" }
    ]
  }
]`}
      </Text>
    </Stack>
  </Card>
);
