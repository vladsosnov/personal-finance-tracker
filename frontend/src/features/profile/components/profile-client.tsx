"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  Alert,
  Button,
  Card,
  Container,
  FileInput,
  Group,
  SegmentedControl,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
  useMantineColorScheme,
} from "@mantine/core";
import { CREATE_GOAL, GET_ME, UPDATE_GOAL_PROGRESS } from "@/features/dashboard/gql/dashboard";
import { DEFAULT_GOAL_COLOR } from "@/shared/constants/goal-colors";
import { APP_ROUTES } from "@/shared/constants/routes";
import { AUTH_TOKEN_KEY } from "@/shared/constants/storage";
import type { OperationType } from "@/shared/gql/__generated__/schema-types";

type ImportHistoryEntry = {
  date?: string;
  note?: string;
  value?: number;
};

type ImportGoalEntry = {
  title?: string;
  targetValue?: number;
  initialValue?: number;
  history?: ImportHistoryEntry[];
  display?: {
    bar?: {
      colors?: {
        primary?: string;
      };
    };
  };
};

type PreparedImportOperation = {
  type: OperationType;
  amount: number;
  note?: string;
  operationDate: string;
};

type PreparedImportGoal = {
  title: string;
  targetAmount: number;
  initialAmount: number;
  color: string;
  operationCount: number;
  operations: PreparedImportOperation[];
};

const ThemeLightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
    <path
      d="M12 2v2.5M12 19.5V22M22 12h-2.5M4.5 12H2M19.07 4.93l-1.77 1.77M6.7 17.3l-1.77 1.77M19.07 19.07l-1.77-1.77M6.7 6.7 4.93 4.93"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const ThemeDarkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const toOperationDate = (value: string | undefined): string | null => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
};

const normalizeColor = (value: string | undefined): string => {
  if (!value) {
    return DEFAULT_GOAL_COLOR;
  }

  const normalized = value.startsWith("#") ? value : `#${value}`;
  const match = normalized.match(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/);

  if (!match) {
    return DEFAULT_GOAL_COLOR;
  }

  return `#${match[1].slice(0, 6).toUpperCase()}`;
};

const prepareImportGoals = (source: string): PreparedImportGoal[] => {
  const parsed = JSON.parse(source) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error("Import file must contain an array of goals");
  }

  return parsed.map((item, goalIndex) => {
    const goal = item as ImportGoalEntry;
    const title = goal.title?.trim();
    const targetAmount = Number(goal.targetValue);
    const initialAmount = Number(goal.initialValue ?? 0);

    if (!title) {
      throw new Error(`Goal ${goalIndex + 1} is missing a valid title`);
    }
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      throw new Error(`Goal ${goalIndex + 1} has an invalid target value`);
    }
    if (!Number.isFinite(initialAmount) || initialAmount < 0) {
      throw new Error(`Goal ${goalIndex + 1} has an invalid initial value`);
    }

    const history = Array.isArray(goal.history) ? goal.history : [];
    const normalizedHistory = history
      .map((entry, historyIndex) => {
        const value = Number(entry.value);
        const operationDate = toOperationDate(entry.date);
        const timestamp = entry.date ? new Date(entry.date).getTime() : Number.NaN;

        if (!Number.isFinite(value)) {
          throw new Error(`Goal ${goalIndex + 1}, history item ${historyIndex + 1} has an invalid value`);
        }
        if (!operationDate || Number.isNaN(timestamp)) {
          throw new Error(`Goal ${goalIndex + 1}, history item ${historyIndex + 1} has an invalid date`);
        }

        return {
          value,
          note: entry.note?.trim() || undefined,
          operationDate,
          timestamp,
        };
      })
      .sort((left, right) => left.timestamp - right.timestamp);

    let previousValue = initialAmount;
    const operations: PreparedImportOperation[] = [];

    for (const entry of normalizedHistory) {
      const delta = Number((entry.value - previousValue).toFixed(2));

      if (delta !== 0) {
        operations.push({
          type: delta > 0 ? "INCREASE" : "DECREASE",
          amount: Math.abs(delta),
          note: entry.note,
          operationDate: entry.operationDate,
        });
      }

      previousValue = entry.value;
    }

    return {
      title,
      targetAmount,
      initialAmount,
      color: normalizeColor(goal.display?.bar?.colors?.primary),
      operationCount: operations.length,
      operations,
    };
  });
};

export const ProfileClient = () => {
  const router = useRouter();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preparedGoals, setPreparedGoals] = useState<PreparedImportGoal[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const [isPreparingImport, setIsPreparingImport] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    setIsAuthed(Boolean(token));
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && !isAuthed) {
      router.replace(APP_ROUTES.auth);
    }
  }, [isAuthed, isHydrated, router]);

  const { data: meData } = useQuery<{ me: { id: string; email: string } | null }>(GET_ME, {
    skip: !isHydrated || !isAuthed,
  });
  const [createGoal] = useMutation<{ createGoal: { id: string } }>(CREATE_GOAL);
  const [updateGoalProgress] = useMutation(UPDATE_GOAL_PROGRESS);

  const importTotals = useMemo(
    () =>
      preparedGoals.reduce(
        (result, goal) => ({
          goals: result.goals + 1,
          operations: result.operations + goal.operationCount,
        }),
        { goals: 0, operations: 0 }
      ),
    [preparedGoals]
  );

  const handlePreviewImport = async () => {
    if (!file) {
      setImportError("Choose a .txt file first");
      setPreparedGoals([]);
      setImportSummary(null);
      return;
    }

    setIsPreparingImport(true);
    setImportError(null);
    setImportSummary(null);

    try {
      const source = await file.text();
      setPreparedGoals(prepareImportGoals(source));
    } catch (error) {
      setPreparedGoals([]);
      setImportError(error instanceof Error ? error.message : "Failed to parse import file");
    } finally {
      setIsPreparingImport(false);
    }
  };

  const handleImport = async () => {
    if (!preparedGoals.length) {
      setImportError("Prepare the file before importing");
      return;
    }

    setIsImporting(true);
    setImportError(null);
    setImportSummary(null);

    try {
      for (const goal of preparedGoals) {
        const result = await createGoal({
          variables: {
            title: goal.title,
            targetAmount: goal.targetAmount,
            initialAmount: goal.initialAmount,
            color: goal.color,
          },
        });

        const goalId = result.data?.createGoal.id;
        if (!goalId) {
          throw new Error(`Failed to create goal "${goal.title}"`);
        }

        for (const operation of goal.operations) {
          await updateGoalProgress({
            variables: {
              goalId,
              type: operation.type,
              amount: operation.amount,
              note: operation.note,
              operationDate: operation.operationDate,
            },
          });
        }
      }

      setImportSummary(`Imported ${importTotals.goals} goals and ${importTotals.operations} operations.`);
      setPreparedGoals([]);
      setFile(null);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Import failed");
    } finally {
      setIsImporting(false);
    }
  };

  if (!isHydrated || !isAuthed) {
    return null;
  }

  return (
    <Container size="md" py={24}>
      <Stack gap="lg">
        <Stack gap={2}>
          <Title order={1}>Profile</Title>
          <Text c="dimmed">Account preferences and progress import.</Text>
        </Stack>

        <Card withBorder radius="md" p="lg">
          <Stack gap="sm">
            <Title order={4}>Email</Title>
            <Text>{meData?.me?.email ?? "Loading..."}</Text>
          </Stack>
        </Card>

        <Card withBorder radius="md" p="lg">
          <Stack gap="md">
            <Title order={4}>Theme</Title>
            <SegmentedControl
              value={colorScheme}
              onChange={(value) => setColorScheme(value as "light" | "dark")}
              data={[
                {
                  value: "light",
                  label: (
                    <Group gap={8} wrap="nowrap">
                      <ThemeIcon size="sm" variant="transparent">
                        <ThemeLightIcon />
                      </ThemeIcon>
                      <span>Light</span>
                    </Group>
                  ),
                },
                {
                  value: "dark",
                  label: (
                    <Group gap={8} wrap="nowrap">
                      <ThemeIcon size="sm" variant="transparent">
                        <ThemeDarkIcon />
                      </ThemeIcon>
                      <span>Dark</span>
                    </Group>
                  ),
                },
              ]}
            />
          </Stack>
        </Card>

        <Card withBorder radius="md" p="lg">
          <Stack gap="md">
            <Stack gap={2}>
              <Title order={4}>Import progress</Title>
              <Text c="dimmed">This reads the exported JSON stored in a .txt file and converts history snapshots into goal operations.</Text>
            </Stack>

            <FileInput
              label="Progress file"
              placeholder="Choose example_of_progress.txt"
              accept=".txt,application/json,text/plain"
              value={file}
              onChange={setFile}
              clearable
            />

            <Group>
              <Button variant="default" onClick={() => void handlePreviewImport()} loading={isPreparingImport} disabled={isImporting}>
                Preview import
              </Button>
              <Button onClick={() => void handleImport()} loading={isImporting} disabled={!preparedGoals.length || isPreparingImport}>
                Import
              </Button>
            </Group>

            {importError && <Alert color="red">{importError}</Alert>}
            {importSummary && <Alert color="teal">{importSummary}</Alert>}

            {preparedGoals.length > 0 && (
              <Stack gap="sm">
                <Text fw={600}>
                  Ready to import {importTotals.goals} goals and {importTotals.operations} operations
                </Text>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Goal</Table.Th>
                      <Table.Th>Target</Table.Th>
                      <Table.Th>Start</Table.Th>
                      <Table.Th>Operations</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {preparedGoals.map((goal, index) => (
                      <Table.Tr key={`${goal.title}-${index}`}>
                        <Table.Td>{goal.title}</Table.Td>
                        <Table.Td>{goal.targetAmount}</Table.Td>
                        <Table.Td>{goal.initialAmount}</Table.Td>
                        <Table.Td>{goal.operationCount}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Stack>
            )}
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
};
