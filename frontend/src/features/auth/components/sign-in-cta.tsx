"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Group } from "@mantine/core";
import { APP_ROUTES } from "@/shared/constants/routes";
import { AUTH_TOKEN_KEY } from "@/shared/constants/storage";

export const SignInCta = () => {
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    setIsAuthed(Boolean(window.localStorage.getItem(AUTH_TOKEN_KEY)));
  }, []);

  if (isAuthed === null) {
    return null;
  }

  return (
    <Group justify="center" mt="sm">
      {isAuthed ? (
        <Button component={Link} href={APP_ROUTES.dashboard} size="md">
          Open dashboard
        </Button>
      ) : (
        <>
          <Button component={Link} href={APP_ROUTES.auth} size="md">
            Get started
          </Button>
          <Button component={Link} href={APP_ROUTES.auth} size="md" variant="light">
            Sign in
          </Button>
        </>
      )}
    </Group>
  );
};
