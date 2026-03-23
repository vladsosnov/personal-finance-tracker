"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApolloClient, useMutation, useQuery } from "@apollo/client/react";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Container,
  FileInput,
  Group,
  Modal,
  Progress,
  SegmentedControl,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
  useMantineColorScheme,
} from "@mantine/core";
import { GET_ME, IMPORT_GOALS, RESET_ALL_DATA } from "@/features/dashboard/gql/dashboard";
import { DEFAULT_GOAL_COLOR } from "@/shared/constants/goal-colors";
import { APP_ROUTES } from "@/shared/constants/routes";
import { AUTH_TOKEN_KEY } from "@/shared/constants/storage";
import type { OperationType } from "@/shared/gql/__generated__/schema-types";
import type { MantineColorScheme } from "@mantine/core";

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
  sourceIndex: number;
  title: string;
  targetAmount: number;
  initialAmount: number;
  color: string;
  operationCount: number;
  operations: PreparedImportOperation[];
  canRemoveFromImport: boolean;
};

type SkippedImportGoal = {
  sourceIndex: number;
  title: string;
  reason: string;
  canInclude: boolean;
};

type PreparedImportResult = {
  goals: PreparedImportGoal[];
  skippedGoals: SkippedImportGoal[];
};

type ImportProgressState = {
  completedSteps: number;
  totalSteps: number;
  currentLabel: string;
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

const ThemeSystemIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="4" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M8 20h8M12 16v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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

const prepareImportGoals = (source: string, includedZeroTargetGoalIndexes: Set<number>): PreparedImportResult => {
  const parsed = JSON.parse(source) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error("Import file must contain an array of goals");
  }

  const goals: PreparedImportGoal[] = [];
  const skippedGoals: SkippedImportGoal[] = [];

  parsed.forEach((item, goalIndex) => {
    const goal = item as ImportGoalEntry;
    const title = goal.title?.trim() || `Goal ${goalIndex + 1}`;
    const targetAmount = Number(goal.targetValue);
    const initialAmount = Number(goal.initialValue ?? 0);

    if (!Number.isFinite(targetAmount) || targetAmount < 0) {
      skippedGoals.push({
        sourceIndex: goalIndex,
        title,
        reason: "Target amount is invalid",
        canInclude: false,
      });
      return;
    }
    if (targetAmount === 0 && !includedZeroTargetGoalIndexes.has(goalIndex)) {
      skippedGoals.push({
        sourceIndex: goalIndex,
        title,
        reason: 'Target amount is missing or zero',
        canInclude: true,
      });
      return;
    }
    if (!Number.isFinite(initialAmount) || initialAmount < 0) {
      skippedGoals.push({
        sourceIndex: goalIndex,
        title,
        reason: "Starting amount is invalid",
        canInclude: false,
      });
      return;
    }

    const history = Array.isArray(goal.history) ? goal.history : [];
    const normalizedHistory = [];

    for (let historyIndex = 0; historyIndex < history.length; historyIndex += 1) {
      const entry = history[historyIndex];
      const value = Number(entry.value);
      const operationDate = toOperationDate(entry.date);
      const timestamp = entry.date ? new Date(entry.date).getTime() : Number.NaN;

      if (!Number.isFinite(value) || !operationDate || Number.isNaN(timestamp)) {
        skippedGoals.push({
          sourceIndex: goalIndex,
          title,
          reason: `History item ${historyIndex + 1} is invalid`,
          canInclude: false,
        });
        return;
      }

      normalizedHistory.push({
        value,
        note: entry.note?.trim() || undefined,
        operationDate,
        timestamp,
      });
    }

    normalizedHistory.sort((left, right) => left.timestamp - right.timestamp);

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

    goals.push({
      sourceIndex: goalIndex,
      title,
      targetAmount,
      initialAmount,
      color: normalizeColor(goal.display?.bar?.colors?.primary),
      operationCount: operations.length,
      operations,
      canRemoveFromImport: targetAmount === 0,
    });
  });

  return {
    goals,
    skippedGoals,
  };
};

export const ProfileClient = () => {
  const router = useRouter();
  const apolloClient = useApolloClient();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importSource, setImportSource] = useState<string | null>(null);
  const [preparedGoals, setPreparedGoals] = useState<PreparedImportGoal[]>([]);
  const [skippedGoals, setSkippedGoals] = useState<SkippedImportGoal[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSummary, setResetSummary] = useState<string | null>(null);
  const [isPreparingImport, setIsPreparingImport] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgressState | null>(null);
  const [includedZeroTargetGoalIndexes, setIncludedZeroTargetGoalIndexes] = useState<number[]>([]);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

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

  const { data: meData } = useQuery<{ me: { id: string; email: string; subscription: string } | null }>(GET_ME, {
    skip: !isHydrated || !isAuthed,
  });
  const [importGoalsMutation] = useMutation<{
    importGoals: {
      importedGoalsCount: number;
      importedOperationsCount: number;
    };
  }>(IMPORT_GOALS);
  const [resetAllDataMutation, { loading: isResettingAllData }] = useMutation<{
    resetAllData: {
      deletedGoalsCount: number;
      deletedOperationsCount: number;
    };
  }>(RESET_ALL_DATA);

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
  const importProgressValue = importProgress ? (importProgress.completedSteps / Math.max(importProgress.totalSteps, 1)) * 100 : 0;

  const applyPreparedImport = (source: string, nextIncludedZeroTargetGoalIndexes: number[]) => {
    const result = prepareImportGoals(source, new Set(nextIncludedZeroTargetGoalIndexes));
    setPreparedGoals(result.goals);
    setSkippedGoals(result.skippedGoals);
    setIncludedZeroTargetGoalIndexes(nextIncludedZeroTargetGoalIndexes);

    if (!result.goals.length && result.skippedGoals.length) {
      setImportError("No valid goals found in the selected file");
      return;
    }

    setImportError(null);
  };

  const handlePreviewImport = async () => {
    if (!file) {
      setImportError("Choose a .txt file first");
      setImportSource(null);
      setPreparedGoals([]);
      setSkippedGoals([]);
      setIncludedZeroTargetGoalIndexes([]);
      setImportSummary(null);
      setResetSummary(null);
      return;
    }

    setIsPreparingImport(true);
    setImportError(null);
    setImportSummary(null);

    try {
      const source = await file.text();
      setImportSource(source);
      applyPreparedImport(source, []);
    } catch (error) {
      setImportSource(null);
      setPreparedGoals([]);
      setSkippedGoals([]);
      setIncludedZeroTargetGoalIndexes([]);
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
    setResetError(null);
    setResetSummary(null);
    setImportProgress({
      completedSteps: 0,
      totalSteps: 3,
      currentLabel: "Preparing import payload...",
    });

    try {
      setImportProgress((current) =>
        current
          ? {
              ...current,
              completedSteps: 1,
              currentLabel: "Sending import request...",
            }
          : current
      );

      const result = await importGoalsMutation({
        variables: {
          goals: preparedGoals.map((goal) => ({
            title: goal.title,
            targetAmount: goal.targetAmount,
            initialAmount: goal.initialAmount,
            color: goal.color,
            operations: goal.operations,
          })),
        },
      });

      setImportProgress((current) =>
        current
          ? {
              ...current,
              completedSteps: 2,
              currentLabel: "Updating dashboard...",
            }
          : current
      );

      const summary = result.data?.importGoals;
      setImportSummary(
        `Imported ${summary?.importedGoalsCount ?? preparedGoals.length} goals and ${summary?.importedOperationsCount ?? importTotals.operations} operations.`
      );
      setPreparedGoals([]);
      setSkippedGoals([]);
      setIncludedZeroTargetGoalIndexes([]);
      setImportSource(null);
      setFile(null);
      await apolloClient.clearStore();
      router.refresh();
      setImportProgress(null);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Import failed");
    } finally {
      setIsImporting(false);
    }
  };

  const handleResetAllData = async () => {
    setResetError(null);
    setResetSummary(null);

    try {
      const result = await resetAllDataMutation();
      const summary = result.data?.resetAllData;

      setPreparedGoals([]);
      setSkippedGoals([]);
      setIncludedZeroTargetGoalIndexes([]);
      setImportSource(null);
      setFile(null);
      setIsResetModalOpen(false);
      setImportProgress(null);
      await apolloClient.clearStore();
      if ((summary?.deletedGoalsCount ?? 0) > 0 || (summary?.deletedOperationsCount ?? 0) > 0) {
        setResetSummary(`Removed ${summary?.deletedGoalsCount ?? 0} goals and ${summary?.deletedOperationsCount ?? 0} operations.`);
      }
      router.refresh();
    } catch (error) {
      setResetError(error instanceof Error ? error.message : "Failed to reset data");
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
            <Title order={4}>Personal information</Title>
            <Text>{meData?.me?.email ?? "Loading..."}</Text>
            <Text>Subscription: {meData?.me?.subscription ?? "Free"}</Text>
          </Stack>
        </Card>

        <Card withBorder radius="md" p="lg">
          <Stack gap="md">
            <Title order={4}>Theme</Title>
            <SegmentedControl
              value={colorScheme}
              onChange={(value) => setColorScheme(value as MantineColorScheme)}
              data={[
                {
                  value: "auto",
                  label: (
                    <Group gap={8} wrap="nowrap">
                      <ThemeIcon size="sm" variant="transparent">
                        <ThemeSystemIcon />
                      </ThemeIcon>
                      <span>System</span>
                    </Group>
                  ),
                },
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

            {file && (
              <Group>
                <Button variant="default" onClick={() => void handlePreviewImport()} loading={isPreparingImport} disabled={isImporting}>
                  Preview import
                </Button>
                <Button onClick={() => void handleImport()} loading={isImporting} disabled={!preparedGoals.length || isPreparingImport}>
                  Import
                </Button>
              </Group>
            )}

            {importError && <Alert color="red">{importError}</Alert>}
            {importSummary && <Alert color="teal">{importSummary}</Alert>}
            {skippedGoals.length > 0 && (
              <Alert color="yellow">
                Skipping {skippedGoals.length} item{skippedGoals.length === 1 ? "" : "s"} during import preview.
              </Alert>
            )}
            {importProgress && (
              <Stack gap={6}>
                <Group justify="space-between" gap="xs">
                  <Text fw={600}>Importing progress</Text>
                  <Text size="sm" c="dimmed">
                    {importProgress.completedSteps} / {importProgress.totalSteps}
                  </Text>
                </Group>
                <Progress value={importProgressValue} animated />
                <Text size="sm" c="dimmed">
                  {importProgress.currentLabel}
                </Text>
              </Stack>
            )}

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
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {preparedGoals.map((goal, index) => (
                      <Table.Tr key={`${goal.title}-${index}`}>
                        <Table.Td>{goal.title}</Table.Td>
                        <Table.Td>{goal.targetAmount}</Table.Td>
                        <Table.Td>{goal.initialAmount}</Table.Td>
                        <Table.Td>{goal.operationCount}</Table.Td>
                        <Table.Td>
                          {goal.canRemoveFromImport ? (
                            <Button
                              variant="subtle"
                              color="red"
                              size="compact-sm"
                              onClick={() => {
                                if (!importSource) {
                                  return;
                                }

                                const nextIncludedIndexes = includedZeroTargetGoalIndexes.filter((item) => item !== goal.sourceIndex);
                                applyPreparedImport(importSource, nextIncludedIndexes);
                              }}
                            >
                              Remove
                            </Button>
                          ) : (
                            "-"
                          )}
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
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Title</Table.Th>
                      <Table.Th>Reason</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {skippedGoals.map((goal, index) => (
                      <Table.Tr key={`${goal.title}-${goal.reason}-${index}`}>
                        <Table.Td>{goal.title}</Table.Td>
                        <Table.Td>{goal.reason}</Table.Td>
                        <Table.Td>
                          {goal.canInclude ? (
                            <Checkbox
                              label="Include"
                              checked={includedZeroTargetGoalIndexes.includes(goal.sourceIndex)}
                              onChange={(event) => {
                                if (!importSource) {
                                  return;
                                }

                                const nextIncludedIndexes = event.currentTarget.checked
                                  ? [...includedZeroTargetGoalIndexes, goal.sourceIndex]
                                  : includedZeroTargetGoalIndexes.filter((item) => item !== goal.sourceIndex);

                                applyPreparedImport(importSource, nextIncludedIndexes);
                              }}
                            />
                          ) : (
                            "-"
                          )}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Stack>
            )}
          </Stack>
        </Card>

        <Card withBorder radius="md" p="lg">
          <Stack gap="sm">
            <Title order={4}>Reset all data</Title>
            <Text c="dimmed">Remove all goals and operations from your account. This cannot be undone.</Text>
            {resetError && <Alert color="red">{resetError}</Alert>}
            {resetSummary && <Alert color="teal">{resetSummary}</Alert>}
            <Group justify="flex-start">
              <Button color="red" variant="light" onClick={() => setIsResetModalOpen(true)}>
                Reset all data
              </Button>
            </Group>
          </Stack>
        </Card>
      </Stack>

      <Modal opened={isResetModalOpen} onClose={() => !isResettingAllData && setIsResetModalOpen(false)} title="Reset all data?" centered>
        <Stack gap="md">
          <Text>This will permanently remove all goals and operations from your account.</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setIsResetModalOpen(false)} disabled={isResettingAllData}>
              Cancel
            </Button>
            <Button color="red" onClick={() => void handleResetAllData()} loading={isResettingAllData}>
              Reset
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
};
