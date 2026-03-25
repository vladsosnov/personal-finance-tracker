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
        <Stack gap="xs">
          <Skeleton height={18} width="42%" />
          <Skeleton height={18} width="28%" />
        </Stack>
      ) : error ? (
        <StateMessage title="Couldn't load profile" description={error.message} actionLabel="Try again" onAction={onRetry} />
      ) : (
        <Text>
          Email: {email ?? "-"}
          <br />
          Subscription: {subscription ?? "Free"}
        </Text>
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
