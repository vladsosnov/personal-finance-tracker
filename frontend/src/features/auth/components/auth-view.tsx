import { Alert, Anchor, Button, Card, Container, PasswordInput, SegmentedControl, Stack, Text, TextInput, Title } from "@mantine/core";
import type { AuthMode } from "@/shared/types/shared";

type AuthViewProps = {
  authMode: AuthMode;
  email: string;
  password: string;
  isLoading: boolean;
  error: string | null;
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
  error,
  setAuthMode,
  setEmail,
  setPassword,
  onSubmit,
}: AuthViewProps) => {
  return (
    <Container size="sm" py={72}>
      <Card withBorder radius="md" p="xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          noValidate
        >
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
            <TextInput
              label="Email"
              type="email"
              autoComplete="email"
              required
              aria-required
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
            />
            <PasswordInput
              label="Password"
              autoComplete={authMode === "register" ? "new-password" : "current-password"}
              required
              aria-required
              value={password}
              onChange={(event) => setPassword(event.currentTarget.value)}
            />
            {error ? <Alert color="red" role="alert">{error}</Alert> : null}
            <Button type="submit" loading={isLoading}>
              {authMode === "register" ? "Create Account" : "Log In"}
            </Button>
            {authMode === "login" && (
              <Anchor href="/auth/forgot-password" size="sm" ta="center">
                Forgot password?
              </Anchor>
            )}
          </Stack>
        </form>
      </Card>
    </Container>
  );
};
