import { Alert, Anchor, Button, Card, Container, Divider, PasswordInput, SegmentedControl, Stack, Text, TextInput, Title } from "@mantine/core";
import type { AuthMode } from "@/shared/types/shared";
import styles from "@/shared/styles/page-animations.module.css";

type AuthViewProps = {
  authMode: AuthMode;
  email: string;
  password: string;
  isLoading: boolean;
  error: string | null;
  emailError: string | null;
  passwordError: string | null;
  googleAuthUrl: string;
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
  emailError,
  passwordError,
  googleAuthUrl,
  setAuthMode,
  setEmail,
  setPassword,
  onSubmit,
}: AuthViewProps) => {
  return (
    <Container size="sm" py={{ base: 32, sm: 72 }} className={styles.authWrapper}>
      <div className={styles.orbContainer}>
        <div className={`${styles.orb} ${styles.orbBlue}`} />
        <div className={`${styles.orb} ${styles.orbViolet}`} />
      </div>

      <Card withBorder radius="md" p="xl" className={styles.authCard} style={{ position: "relative", zIndex: 1 }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          noValidate
        >
          <Stack>
            <Title order={2} className={styles.authTitle}>Financial Goals Tracker</Title>
            <Text c="dimmed">Sign in to manage your own goals and progress history.</Text>
            <Button
              component="a"
              href={googleAuthUrl}
              variant="default"
              leftSection={
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
                </svg>
              }
            >
              Continue with Google
            </Button>
            <Divider label="or" labelPosition="center" />
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
              error={emailError}
              onChange={(event) => setEmail(event.currentTarget.value)}
            />
            <PasswordInput
              label="Password"
              autoComplete={authMode === "register" ? "new-password" : "current-password"}
              required
              aria-required
              value={password}
              error={passwordError}
              description={authMode === "register" ? "At least 8 characters" : undefined}
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
