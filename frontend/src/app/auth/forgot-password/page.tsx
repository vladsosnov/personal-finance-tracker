"use client";

import { useState } from "react";
import { Alert, Anchor, Button, Card, Container, Stack, Text, TextInput, Title } from "@mantine/core";
import { API_BASE_URL } from "@/shared/constants/auth";
import { APP_ROUTES } from "@/shared/constants/routes";
import { trackEvent } from "@/shared/lib/analytics";
import { isValidEmail } from "@/shared/lib/validation";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setEmailError(null);
    if (!isValidEmail(email)) {
      setEmailError("Enter a valid email address");
      return;
    }

    trackEvent("forgot_password_click");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Request failed");
      }

      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container size="sm" py={72}>
      <Card withBorder radius="md" p="xl">
        {sent ? (
          <Stack align="center" gap="md">
            <Title order={2}>Check your email</Title>
            <Text c="dimmed" ta="center">
              If an account exists for {email}, we sent a password reset link. Check your inbox and spam folder.
            </Text>
            <Anchor href={APP_ROUTES.auth}>Back to sign in</Anchor>
          </Stack>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            noValidate
          >
            <Stack>
              <Title order={2}>Forgot password</Title>
              <Text c="dimmed">
                Enter your email and we will send you a link to reset your password.
              </Text>
              <TextInput
                label="Email"
                type="email"
                autoComplete="email"
                required
                aria-required
                value={email}
                error={emailError}
                onChange={(e) => { setEmail(e.currentTarget.value); setEmailError(null); }}
              />
              {error && <Alert color="red" role="alert">{error}</Alert>}
              <Button type="submit" loading={isLoading} disabled={!email.trim()}>
                Send reset link
              </Button>
              <Anchor href={APP_ROUTES.auth} size="sm" ta="center">
                Back to sign in
              </Anchor>
            </Stack>
          </form>
        )}
      </Card>
    </Container>
  );
};

export default ForgotPasswordPage;
