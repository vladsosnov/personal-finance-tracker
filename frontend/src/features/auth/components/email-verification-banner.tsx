"use client";

import { useState } from "react";
import { Alert, Button, Group, Text } from "@mantine/core";
import { API_BASE_URL } from "@/shared/constants/auth";

type EmailVerificationBannerProps = {
  emailVerified: boolean;
};

export const EmailVerificationBanner = ({ emailVerified }: EmailVerificationBannerProps) => {
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (emailVerified) return null;

  const handleResend = async () => {
    setIsSending(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/request-verification`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Failed to send verification email");
      }

      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send verification email");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Alert color="yellow" variant="light" role="status">
      <Group justify="space-between" align="center" wrap="wrap" gap="sm">
        <Text size="sm" fw={500}>
          {sent
            ? "Verification email sent! Check your inbox."
            : "Your email is not verified. Please check your inbox for a verification link."}
        </Text>
        {error && <Text size="sm" c="red">{error}</Text>}
        {!sent && (
          <Button size="xs" variant="light" color="yellow" onClick={handleResend} loading={isSending}>
            Resend verification email
          </Button>
        )}
      </Group>
    </Alert>
  );
};
