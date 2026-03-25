import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApolloClient, useLazyQuery, useMutation, useQuery } from "@apollo/client/react";
import { EXPORT_ALL_DATA, GET_GOALS, IMPORT_GOALS, RESET_ALL_DATA } from "@/features/dashboard/gql/dashboard";
import { GET_ME } from "@/shared/gql/queries";
import type { Goal } from "@/features/dashboard/types";
import type { ImportProgressState, PreparedImportGoal, SkippedImportGoal } from "@/features/profile/types";
import { prepareImportGoals } from "@/features/profile/utils/prepareImport";
import { showToast } from "@/shared/lib/toast-store";
import { API_BASE_URL } from "@/shared/constants/auth";
import { APP_ROUTES } from "@/shared/constants/routes";
import { trackEvent } from "@/shared/lib/analytics";
import { getPlanByName } from "@/shared/constants/plans";

export const useDataManagement = () => {
  const apolloClient = useApolloClient();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [importSource, setImportSource] = useState<string | null>(null);
  const [preparedGoals, setPreparedGoals] = useState<PreparedImportGoal[]>([]);
  const [skippedGoals, setSkippedGoals] = useState<SkippedImportGoal[]>([]);
  const [isPreparingImport, setIsPreparingImport] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgressState | null>(null);
  const [includedZeroTargetGoalIndexes, setIncludedZeroTargetGoalIndexes] = useState<number[]>([]);
  const [excludedGoalIndexes, setExcludedGoalIndexes] = useState<number[]>([]);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const { data: meData, loading: isLoadingMe, error: meError, refetch: refetchMe } =
    useQuery<{ me: { id: string; email: string; subscription: string; emailVerified: boolean } | null }>(GET_ME);

  const { data: goalsData, loading: isLoadingGoals, error: goalsError, refetch: refetchGoals } =
    useQuery<{ goals: Goal[] }>(GET_GOALS);

  const [importGoalsMutation] = useMutation<{
    importGoals: { importedGoalsCount: number; importedOperationsCount: number };
  }>(IMPORT_GOALS);

  const [resetAllDataMutation, { loading: isResettingAllData }] = useMutation<{
    resetAllData: { deletedGoalsCount: number; deletedOperationsCount: number };
  }>(RESET_ALL_DATA);

  const [exportAllDataQuery, { loading: isExportingAllData }] = useLazyQuery<{ exportAllData: string }>(EXPORT_ALL_DATA, {
    fetchPolicy: "no-cache",
  });

  const plan = getPlanByName(meData?.me?.subscription ?? "Free");
  const existingGoalCount = goalsData?.goals.length ?? 0;
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

  const handleImport = async () => {
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
          goals: preparedGoals.map(({ title, targetAmount, initialAmount, color, operations }) => ({
            title, targetAmount, initialAmount, color, operations,
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

  const handleResetAllData = async () => {
    trackEvent("data_reset");
    try {
      const result = await resetAllDataMutation();
      const summary = result.data?.resetAllData;

      resetImportState();
      setFile(null);
      setIsResetModalOpen(false);
      await apolloClient.clearStore();
      await refetchGoals();

      if ((summary?.deletedGoalsCount ?? 0) > 0 || (summary?.deletedOperationsCount ?? 0) > 0) {
        showToast(`Removed ${summary?.deletedGoalsCount ?? 0} goals and ${summary?.deletedOperationsCount ?? 0} operations.`, "teal");
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to reset data", "red");
    }
  };

  const handleDeleteAccount = async () => {
    trackEvent("delete_account_click");
    setIsDeletingAccount(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/delete-account`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Failed to delete account");
      }
      await apolloClient.clearStore();
      router.replace(APP_ROUTES.home);
      router.refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to delete account", "red");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleExportAllData = async () => {
    trackEvent("data_exported");
    try {
      const result = await exportAllDataQuery();
      const payload = result.data?.exportAllData;
      if (!payload) throw new Error("Nothing to export");

      const blob = new Blob([payload], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `financial-goals-tracker-export-${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      showToast("Exported all goals and operations.", "teal");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to export data", "red");
    }
  };

  return {
    // user info
    meData,
    isLoadingMe,
    meError,
    refetchMe,
    // goals meta
    goalsData,
    isLoadingGoals,
    goalsError,
    refetchGoals,
    hasStoredData: (goalsData?.goals.length ?? 0) > 0,
    // import
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
    // export
    isExportingAllData,
    handleExportAllData,
    // reset
    isResetModalOpen,
    isResettingAllData,
    openResetModal: () => setIsResetModalOpen(true),
    closeResetModal: () => setIsResetModalOpen(false),
    handleResetAllData,
    // delete account
    isDeleteAccountModalOpen,
    isDeletingAccount,
    openDeleteAccountModal: () => setIsDeleteAccountModalOpen(true),
    closeDeleteAccountModal: () => setIsDeleteAccountModalOpen(false),
    handleDeleteAccount,
  };
};
