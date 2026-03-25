"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Alert, Anchor, Button, Card, Container, PasswordInput, Stack, Text, Title } from "@mantine/core";
import { API_BASE_URL } from "@/shared/constants/auth";
import { APP_ROUTES } from "@/shared/constants/routes";

const ResetPasswordPage = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordsMatch = password === confirmPassword;
  const isValid = password.length >= 8 && passwordsMatch;

  const handleSubmit = async () => {
    if (!isValid || !token) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Password reset failed");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password reset failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <Container size="sm" py={72}>
        <Card withBorder radius="md" p="xl">
          <Stack align="center" gap="md">
            <Title order={2}>Invalid link</Title>
            <Text c="red">Missing reset token. Please use the link from your email.</Text>
            <Anchor href={APP_ROUTES.auth}>Back to sign in</Anchor>
          </Stack>
        </Card>
      </Container>
    );
  }

  if (success) {
    return (
      <Container size="sm" py={72}>
        <Card withBorder radius="md" p="xl">
          <Stack align="center" gap="md">
            <Title order={2}>Password reset</Title>
            <Text c="dimmed">Your password has been successfully reset.</Text>
            <Anchor href={APP_ROUTES.auth}>Sign in with your new password</Anchor>
          </Stack>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="sm" py={72}>
      <Card withBorder radius="md" p="xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          noValidate
        >
          <Stack>
            <Title order={2}>Reset password</Title>
            <Text c="dimmed">Enter your new password.</Text>
            <PasswordInput
              label="New password"
              autoComplete="new-password"
              required
              aria-required
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              error={password.length > 0 && password.length < 8 ? "Must be at least 8 characters" : undefined}
            />
            <PasswordInput
              label="Confirm password"
              autoComplete="new-password"
              required
              aria-required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.currentTarget.value)}
              error={confirmPassword.length > 0 && !passwordsMatch ? "Passwords do not match" : undefined}
            />
            {error && <Alert color="red" role="alert">{error}</Alert>}
            <Button type="submit" loading={isLoading} disabled={!isValid}>
              Reset password
            </Button>
            <Anchor href={APP_ROUTES.auth} size="sm" ta="center">
              Back to sign in
            </Anchor>
          </Stack>
        </form>
      </Card>
    </Container>
  );
};

export default ResetPasswordPage;
