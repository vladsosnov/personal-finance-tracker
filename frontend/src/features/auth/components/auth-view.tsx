import { Button, Card, Container, PasswordInput, SegmentedControl, Stack, Text, TextInput, Title } from "@mantine/core";
import type { AuthMode } from "@/shared/types/shared";

type AuthViewProps = {
  authMode: AuthMode;
  email: string;
  password: string;
  isLoading: boolean;
  setAuthMode: (value: AuthMode) => void;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  onSubmit: () => Promise<void>;
};

export const AuthView = ({
  authMode,
  email,
  password,
  isLoading,
  setAuthMode,
  setEmail,
  setPassword,
  onSubmit,
}: AuthViewProps) => {
  return (
    <Container size="sm" py={72}>
      <Card withBorder radius="md" p="xl">
        <Stack>
          <Title order={2}>Financial Goals Tracker</Title>
          <Text c="dimmed">Sign in to manage your own goals and progress history.</Text>
          <SegmentedControl
            data={[
              { label: "Log In", value: "login" },
              { label: "Register", value: "register" },
            ]}
            value={authMode}
            onChange={(value) => setAuthMode(value as AuthMode)}
          />
          <TextInput label="Email" value={email} onChange={(event) => setEmail(event.currentTarget.value)} />
          <PasswordInput label="Password" value={password} onChange={(event) => setPassword(event.currentTarget.value)} />
          <Button onClick={onSubmit} loading={isLoading}>
            {authMode === "register" ? "Create Account" : "Log In"}
          </Button>
        </Stack>
      </Card>
    </Container>
  );
};
