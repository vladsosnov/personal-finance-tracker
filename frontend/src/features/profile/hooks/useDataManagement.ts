import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApolloClient, useMutation, useQuery } from "@apollo/client/react";
import { GET_GOALS, RESET_ALL_DATA, type GoalsQueryData } from "@/features/dashboard/gql/dashboard";
import { GET_ME, type MeQueryData } from "@/shared/gql/queries";
import { CREATE_BILLING_CHECKOUT, CREATE_BILLING_PORTAL_SESSION } from "@/features/profile/gql/billing";
import { showToast } from "@/shared/lib/toast-store";
import { API_BASE_URL } from "@/shared/constants/auth";
import { APP_ROUTES } from "@/shared/constants/routes";
import { trackEvent } from "@/shared/lib/analytics";
import { redirectToUrl } from "@/shared/lib/browser-navigation";
import { useImport } from "@/features/profile/hooks/useImport";
import { useExport } from "@/features/profile/hooks/useExport";

type BillingCheckoutResponse = {
  createBillingCheckout: {
    url: string;
  };
};

type BillingPortalResponse = {
  createBillingPortalSession: {
    url: string;
  };
};

export const useDataManagement = () => {
  const apolloClient = useApolloClient();
  const router = useRouter();

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [activeCheckoutPlan, setActiveCheckoutPlan] = useState<"PRO" | "LIFETIME" | null>(null);

  const { data: meData, loading: isLoadingMe, error: meError, refetch: refetchMe } =
    useQuery<MeQueryData>(GET_ME);

  const { data: goalsData, loading: isLoadingGoals, error: goalsError, refetch: refetchGoals } =
    useQuery<GoalsQueryData>(GET_GOALS);

  const [resetAllDataMutation, { loading: isResettingAllData }] = useMutation<{
    resetAllData: { deletedGoalsCount: number; deletedOperationsCount: number };
  }>(RESET_ALL_DATA);
  const [createBillingCheckoutMutation, { loading: isCreatingBillingCheckout }] =
    useMutation<BillingCheckoutResponse>(CREATE_BILLING_CHECKOUT);
  const [createBillingPortalSessionMutation, { loading: isCreatingBillingPortalSession }] =
    useMutation<BillingPortalResponse>(CREATE_BILLING_PORTAL_SESSION);

  const imp = useImport(meData?.me?.subscription ?? "Free", goalsData?.goals.length ?? 0);
  const exp = useExport();

  const handleImport = () => imp.handleImport(refetchGoals);

  const handleResetAllData = async () => {
    trackEvent("data_reset");
    try {
      const result = await resetAllDataMutation();
      const summary = result.data?.resetAllData;

      imp.resetImportState();
      imp.resetFile();
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
      await apolloClient.resetStore();
      router.replace(APP_ROUTES.home);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to delete account", "red");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleStartCheckout = async (plan: "PRO" | "LIFETIME") => {
    trackEvent(plan === "PRO" ? "billing_checkout_pro" : "billing_checkout_lifetime");
    setActiveCheckoutPlan(plan);
    try {
      const result = await createBillingCheckoutMutation({
        variables: { plan },
      });
      const url = result.data?.createBillingCheckout?.url;
      if (!url) {
        throw new Error("Failed to create billing checkout");
      }

      redirectToUrl(url);
    } catch (error) {
      setActiveCheckoutPlan(null);
      showToast(error instanceof Error ? error.message : "Failed to start checkout", "red");
    }
  };

  const handleManageBilling = async () => {
    trackEvent("billing_portal_open");
    try {
      const result = await createBillingPortalSessionMutation();
      const url = result.data?.createBillingPortalSession?.url;
      if (!url) {
        throw new Error("Failed to create billing portal session");
      }

      redirectToUrl(url);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to open billing portal", "red");
    }
  };

  const canManageBilling = meData?.me?.plan === "pro" && meData?.me?.billingStatus === "active";
  const billingState: "idle" | "checkout" | "portal" = isCreatingBillingCheckout
    ? "checkout"
    : isCreatingBillingPortalSession
      ? "portal"
      : "idle";

  return {
    // user info
    meData,
    isLoadingMe,
    meError,
    refetchMe,
    canManageBilling,
    billingState,
    activeCheckoutPlan,
    handleStartCheckout,
    handleManageBilling,
    // goals meta
    goalsData,
    isLoadingGoals,
    goalsError,
    refetchGoals,
    hasStoredData: (goalsData?.goals.length ?? 0) > 0,
    // import
    file: imp.file,
    preparedGoals: imp.preparedGoals,
    skippedGoals: imp.skippedGoals,
    importLimitMessage: imp.importLimitMessage,
    isImportOverLimit: imp.isImportOverLimit,
    importTotals: imp.importTotals,
    importProgress: imp.importProgress,
    importProgressValue: imp.importProgressValue,
    isPreparingImport: imp.isPreparingImport,
    isImporting: imp.isImporting,
    includedZeroTargetGoalIndexes: imp.includedZeroTargetGoalIndexes,
    handleFileChange: imp.handleFileChange,
    handleToggleZeroTargetGoal: imp.handleToggleZeroTargetGoal,
    handleRemoveFromImport: imp.handleRemoveFromImport,
    handleImport,
    // export
    isExportingAllData: exp.isExportingAllData,
    handleExportAllData: exp.handleExportAllData,
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
