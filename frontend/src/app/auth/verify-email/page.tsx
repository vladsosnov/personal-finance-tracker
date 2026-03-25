"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Anchor, Card, Container, Loader, Stack, Text, Title } from "@mantine/core";
import { API_BASE_URL } from "@/shared/constants/auth";
import { APP_ROUTES } from "@/shared/constants/routes";

const VerifyEmailPage = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const calledRef = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Missing verification token.");
      return;
    }

    if (calledRef.current) return;
    calledRef.current = true;

    const verify = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/auth/verify-email?token=${encodeURIComponent(token)}`
        );

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error ?? "Verification failed");
        }

        setStatus("success");
      } catch (err) {
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "Verification failed");
      }
    };

    verify();
  }, [token]);

  return (
    <Container size="sm" py={72}>
      <Card withBorder radius="md" p="xl">
        <Stack align="center" gap="md">
          {status === "loading" && (
            <>
              <Loader size="lg" />
              <Text>Verifying your email...</Text>
            </>
          )}

          {status === "success" && (
            <>
              <Title order={2}>Email verified</Title>
              <Text c="dimmed">
                Your email has been successfully verified.
              </Text>
              <Anchor href={APP_ROUTES.dashboard}>Go to Dashboard</Anchor>
            </>
          )}

          {status === "error" && (
            <>
              <Title order={2}>Verification failed</Title>
              <Text c="red">{errorMessage}</Text>
              <Anchor href={APP_ROUTES.auth}>Back to sign in</Anchor>
            </>
          )}
        </Stack>
      </Card>
    </Container>
  );
};

export default VerifyEmailPage;
