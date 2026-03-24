import { Button, Card, Group, Stack, Text, Title } from "@mantine/core";
import { StateMessage } from "@/shared/components/state-message";
type DataManagementCardProps = {
  hasStoredData: boolean;
  isLoadingGoals: boolean;
  goalsError?: Error;
  isExportingAllData: boolean;
  onExport: () => void;
  onOpenResetModal: () => void;
  onRetry: () => void;
};

export const DataManagementCard = ({
  hasStoredData,
  isLoadingGoals,
  goalsError,
  isExportingAllData,
  onExport,
  onOpenResetModal,
  onRetry,
}: DataManagementCardProps) => (
  <Card withBorder radius="md" p="lg">
    <Stack gap="md">
      <Stack gap={2}>
        <Title order={4}>Data management</Title>
        <Text c="dimmed">Export your goals as a `.txt` backup or permanently remove all saved goals and operations.</Text>
      </Stack>
      {goalsError && (
        <StateMessage title="Couldn't load saved data" description={goalsError.message} actionLabel="Try again" onAction={onRetry} />
      )}
      <Group justify="flex-start">
        <Button
          variant="light"
          onClick={onExport}
          loading={isExportingAllData}
          disabled={!hasStoredData || isLoadingGoals || Boolean(goalsError)}
        >
          Export all data
        </Button>
        <Button
          color="red"
          variant="light"
          onClick={onOpenResetModal}
          disabled={!hasStoredData || isLoadingGoals || Boolean(goalsError)}
        >
          Reset all data
        </Button>
      </Group>
    </Stack>
  </Card>
);
