import { Card, Skeleton, Stack, Text, Title } from "@mantine/core";
import { StateMessage } from "@/shared/components/state-message";
import type { ApolloError } from "@apollo/client";

type ProfileInfoCardProps = {
  email?: string;
  subscription?: string;
  isLoading: boolean;
  error?: ApolloError;
  onRetry: () => void;
};

export const ProfileInfoCard = ({ email, subscription, isLoading, error, onRetry }: ProfileInfoCardProps) => (
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
    </Stack>
  </Card>
);
