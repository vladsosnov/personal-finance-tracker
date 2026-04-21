import { useMemo, useState } from "react";
import { useApolloClient, useMutation } from "@apollo/client/react";
import { GET_GOALS, IMPORT_GOALS, type GoalsQueryData } from "@/features/dashboard/gql/dashboard";
import type { ImportProgressState, PreparedImportGoal, SkippedImportGoal } from "@/features/profile/types";
import { prepareImportGoals } from "@/features/profile/utils/prepareImport";
import { showToast } from "@/shared/lib/toast-store";
import { trackEvent } from "@/shared/lib/analytics";
import { getPlanByName } from "@/shared/constants/plans";

export const useImport = (subscription: string, existingGoalCount: number) => {
  const apolloClient = useApolloClient();

  const [file, setFile] = useState<File | null>(null);
  const [importSource, setImportSource] = useState<string | null>(null);
  const [preparedGoals, setPreparedGoals] = useState<PreparedImportGoal[]>([]);
  const [skippedGoals, setSkippedGoals] = useState<SkippedImportGoal[]>([]);
  const [isPreparingImport, setIsPreparingImport] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgressState | null>(null);
  const [includedZeroTargetGoalIndexes, setIncludedZeroTargetGoalIndexes] = useState<number[]>([]);
  const [excludedGoalIndexes, setExcludedGoalIndexes] = useState<number[]>([]);

  const [importGoalsMutation] = useMutation<{
    importGoals: { importedGoalsCount: number; importedOperationsCount: number };
  }>(IMPORT_GOALS);

  const plan = getPlanByName(subscription);
  const remainingSlots = plan.maxGoals !== null ? Math.max(0, plan.maxGoals - existingGoalCount) : null;

  const isImportOverLimit = remainingSlots !== null && preparedGoals.length > remainingSlots;

  const importLimitMessage = isImportOverLimit
    ? `Free plan is limited to ${plan.maxGoals} goals. Remove ${preparedGoals.length - remainingSlots!} goal${preparedGoals.length - remainingSlots! === 1 ? "" : "s"} to proceed.`
    : null;

  const importTotals = useMemo(
    () => preparedGoals.reduce((acc, goal) => ({ goals: acc.goals + 1, operations: acc.operations + goal.operationCount }), { goals: 0, operations: 0 }),
    [preparedGoals]
  );

  const importProgressValue = importProgress
    ? (importProgress.completedSteps / Math.max(importProgress.totalSteps, 1)) * 100
    : 0;

  const resetImportState = () => {
    setImportSource(null);
    setPreparedGoals([]);
    setSkippedGoals([]);
    setIncludedZeroTargetGoalIndexes([]);
    setExcludedGoalIndexes([]);
    setImportProgress(null);
  };

  const applyPreparedImport = (source: string, nextIncludedIndexes: number[], nextExcludedIndexes: number[] = excludedGoalIndexes) => {
    const result = prepareImportGoals(source, new Set(nextIncludedIndexes), new Set(nextExcludedIndexes));
    setPreparedGoals(result.goals);
    setSkippedGoals(result.skippedGoals);
    setIncludedZeroTargetGoalIndexes(nextIncludedIndexes);
    setExcludedGoalIndexes(nextExcludedIndexes);

    if (!result.goals.length && !result.skippedGoals.length) {
      showToast("No goals found in the selected file", "red");
      return;
    }
    if (!result.goals.length) {
      showToast("No valid goals found in the selected file", "red");
      return;
    }
  };

  const previewImportFile = async (nextFile: File | null) => {
    if (!nextFile) {
      resetImportState();
      return;
    }

    setIsPreparingImport(true);
    try {
      const MAX_IMPORT_FILE_SIZE = 100 * 1024; // 100 KB — matches backend limit
      if (nextFile.size > MAX_IMPORT_FILE_SIZE) {
        showToast(`File is too large (${(nextFile.size / 1024).toFixed(0)} KB). Maximum size is 100 KB.`, "red");
        setIsPreparingImport(false);
        return;
      }
      const source = await nextFile.text();
      setImportSource(source);
      applyPreparedImport(source, [], []);
    } catch (error) {
      resetImportState();
      showToast(error instanceof Error ? error.message : "Failed to parse import file", "red");
    } finally {
      setIsPreparingImport(false);
    }
  };

  const handleFileChange = (nextFile: File | null) => {
    setFile(nextFile);
    previewImportFile(nextFile);
  };

  const handleToggleZeroTargetGoal = (sourceIndex: number, include: boolean) => {
    if (!importSource) return;
    const nextIncluded = include
      ? [...includedZeroTargetGoalIndexes, sourceIndex]
      : includedZeroTargetGoalIndexes.filter((i) => i !== sourceIndex);
    const nextExcluded = include
      ? excludedGoalIndexes.filter((i) => i !== sourceIndex)
      : excludedGoalIndexes;
    applyPreparedImport(importSource, nextIncluded, nextExcluded);
  };

  const handleRemoveFromImport = (sourceIndex: number) => {
    if (!importSource) return;
    const nextIncluded = includedZeroTargetGoalIndexes.filter((i) => i !== sourceIndex);
    const nextExcluded = [...excludedGoalIndexes, sourceIndex];
    applyPreparedImport(importSource, nextIncluded, nextExcluded);
  };

  const handleImport = async (refetchGoals: () => Promise<unknown>) => {
    if (!preparedGoals.length) {
      showToast("Prepare the file before importing", "red");
      return;
    }

    trackEvent("data_imported");
    setIsImporting(true);
    setImportProgress({ completedSteps: 0, totalSteps: 3, currentLabel: "Preparing import payload..." });

    try {
      setImportProgress((p) => p ? { ...p, completedSteps: 1, currentLabel: "Sending import request..." } : p);

      const result = await importGoalsMutation({
        variables: {
          goals: preparedGoals.map(({ title, targetAmount, initialAmount, currency, color, operations }) => ({
            title, targetAmount, initialAmount, currency, color, operations,
          })),
        },
      });

      setImportProgress((p) => p ? { ...p, completedSteps: 2, currentLabel: "Updating dashboard..." } : p);

      const summary = result.data?.importGoals;
      showToast(
        `Imported ${summary?.importedGoalsCount ?? preparedGoals.length} goals and ${summary?.importedOperationsCount ?? importTotals.operations} operations.`,
        "teal"
      );

      resetImportState();
      setFile(null);
      await apolloClient.clearStore();
      await refetchGoals();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Import failed", "red");
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  return {
    file,
    preparedGoals,
    skippedGoals,
    importLimitMessage,
    isImportOverLimit,
    importTotals,
    importProgress,
    importProgressValue,
    isPreparingImport,
    isImporting,
    includedZeroTargetGoalIndexes,
    handleFileChange,
    handleToggleZeroTargetGoal,
    handleRemoveFromImport,
    handleImport,
    resetImportState,
    resetFile: () => setFile(null),
  };
};
