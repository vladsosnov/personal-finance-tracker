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

  if (isAuthed === null || isAuthed) {
    return null;
  }

  return (
    <Group justify="center" mt="sm">
      <Button component={Link} href={APP_ROUTES.auth} size="md">
        Sign In
      </Button>
    </Group>
  );
};
