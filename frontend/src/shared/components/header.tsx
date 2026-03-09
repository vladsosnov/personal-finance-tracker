"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button, Container, Group, Text } from "@mantine/core";
import { APP_ROUTES } from "@/shared/constants/routes";
import { AUTH_TOKEN_KEY } from "@/shared/constants/storage";

export const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    setIsAuthed(Boolean(window.localStorage.getItem(AUTH_TOKEN_KEY)));
  }, [pathname]);

  const handleLogout = () => {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    setIsAuthed(false);
    router.push(APP_ROUTES.home);
    router.refresh();
  };

  return (
    <header className="app-header">
      <Container size="lg" py="sm">
        <Group justify="space-between">
          <Text fw={800}>Finance Goals</Text>
          <Group gap="xs">
            <Button component={Link} href={APP_ROUTES.home} variant={pathname === APP_ROUTES.home ? "light" : "subtle"}>
              Home
            </Button>
            <Button
              component={Link}
              href={APP_ROUTES.dashboard}
              variant={pathname === APP_ROUTES.dashboard ? "light" : "subtle"}
            >
              Dashboard
            </Button>
            {isAuthed && (
              <Button onClick={handleLogout} color="red" variant="subtle">
                Log Out
              </Button>
            )}
          </Group>
        </Group>
      </Container>
    </header>
  );
};
