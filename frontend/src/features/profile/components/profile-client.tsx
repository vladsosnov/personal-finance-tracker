"use client";

import { Stack, Text, Title } from "@mantine/core";
import { EmailVerificationBanner } from "@/features/auth/components/email-verification-banner";
import { PageContainer } from "@/shared/components/page-container";
import { DataManagementCard } from "@/features/profile/components/DataManagementCard";
import { ImportProgressCard } from "@/features/profile/components/ImportProgressCard";
import { ProfileInfoCard } from "@/features/profile/components/ProfileInfoCard";
import { SubscriptionCard } from "@/features/profile/components/SubscriptionCard";
import { ThemeCard } from "@/features/profile/components/ThemeCard";
import { DeleteAccountModal } from "@/features/profile/components/modals/DeleteAccountModal";
import { ResetDataModal } from "@/features/profile/components/modals/ResetDataModal";
import { useDataManagement } from "@/features/profile/hooks/useDataManagement";

export const ProfileClient = () => {
  const dm = useDataManagement();

  return (
    <PageContainer>
      <Stack gap="lg">
        {dm.meData?.me && !dm.meData.me.emailVerified && (
          <EmailVerificationBanner emailVerified={false} />
        )}

        <Stack gap={2}>
          <Title order={1}>Profile</Title>
          <Text c="dimmed">Account preferences and progress import.</Text>
        </Stack>

        <ProfileInfoCard
          email={dm.meData?.me?.email}
          subscription={dm.meData?.me?.subscription}
          isLoading={dm.isLoadingMe}
          error={dm.meError}
          onRetry={dm.refetchMe}
          onDeleteAccount={dm.openDeleteAccountModal}
        />

        <SubscriptionCard currentSubscription={dm.meData?.me?.subscription ?? "Free"} />

        <ThemeCard />

        <ImportProgressCard
          file={dm.file}
          preparedGoals={dm.preparedGoals}
          skippedGoals={dm.skippedGoals}
          importTotals={dm.importTotals}
          importProgress={dm.importProgress}
          importProgressValue={dm.importProgressValue}
          isPreparingImport={dm.isPreparingImport}
          isImporting={dm.isImporting}
          includedZeroTargetGoalIndexes={dm.includedZeroTargetGoalIndexes}
          onFileChange={dm.handleFileChange}
          onImport={dm.handleImport}
          onToggleZeroTargetGoal={dm.handleToggleZeroTargetGoal}
          onRemoveFromImport={dm.handleRemoveFromImport}
        />

        <DataManagementCard
          hasStoredData={dm.hasStoredData}
          isLoadingGoals={dm.isLoadingGoals}
          goalsError={dm.goalsError}
          isExportingAllData={dm.isExportingAllData}
          onExport={dm.handleExportAllData}
          onOpenResetModal={dm.openResetModal}
          onRetry={dm.refetchGoals}
        />
      </Stack>

      <ResetDataModal
        opened={dm.isResetModalOpen}
        isLoading={dm.isResettingAllData}
        onConfirm={dm.handleResetAllData}
        onClose={dm.closeResetModal}
      />

      <DeleteAccountModal
        opened={dm.isDeleteAccountModalOpen}
        isLoading={dm.isDeletingAccount}
        onConfirm={dm.handleDeleteAccount}
        onClose={dm.closeDeleteAccountModal}
      />
    </PageContainer>
  );
};
