import { Button, Card, Group, Skeleton, Stack, Text, Title } from "@mantine/core";
import { StateMessage } from "@/shared/components/state-message";
type ProfileInfoCardProps = {
  email?: string;
  subscription?: string;
  isLoading: boolean;
  error?: Error;
  onRetry: () => void;
  onDeleteAccount: () => void;
};

export const ProfileInfoCard = ({ email, subscription, isLoading, error, onRetry, onDeleteAccount }: ProfileInfoCardProps) => (
  <Card withBorder radius="md" p="lg">
    <Stack gap="md">
      <Title order={4}>Personal information</Title>
      {isLoading ? (
        <div role="status" aria-label="Loading profile">
          <span className="sr-only">Loading profile...</span>
          <Stack gap="xs">
            <Skeleton height={18} width="42%" />
            <Skeleton height={18} width="28%" />
          </Stack>
        </div>
      ) : error ? (
        <StateMessage title="Couldn't load profile" description={error.message} actionLabel="Try again" onAction={onRetry} />
      ) : (
        <dl style={{ margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <Text component="dt" fw={500}>Email:</Text>
            <Text component="dd" style={{ margin: 0 }}>{email ?? "-"}</Text>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <Text component="dt" fw={500}>Subscription:</Text>
            <Text component="dd" style={{ margin: 0 }}>{subscription ?? "Free"}</Text>
          </div>
        </dl>
      )}
      {!isLoading && !error && (
        <Group>
          <Button color="red" variant="light" size="xs" onClick={onDeleteAccount}>
            Delete account
          </Button>
        </Group>
      )}
    </Stack>
  </Card>
);
