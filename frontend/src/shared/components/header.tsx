"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApolloClient, useQuery } from "@apollo/client/react";
import { Button, Container, Group, Text } from "@mantine/core";
import { GET_ME } from "@/shared/gql/queries";
import { API_BASE_URL } from "@/shared/constants/auth";
import { APP_ROUTES } from "@/shared/constants/routes";

export const Header = () => {
  const apolloClient = useApolloClient();
  const router = useRouter();
  const pathname = usePathname();
  const { data: meData } = useQuery<{ me: { id: string } | null }>(GET_ME, {
    fetchPolicy: "cache-and-network",
  });
  const isAuthed = Boolean(meData?.me);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      await apolloClient.resetStore();
      router.push(APP_ROUTES.home);
      router.refresh();
    }
  };

  return (
    <header className="app-header">
      <Container size="xl" py="sm">
        <Group justify="space-between">
          <Text fw={800}>Financial Goals Tracker</Text>
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
              <>
                <Button component={Link} href={APP_ROUTES.profile} variant={pathname === APP_ROUTES.profile ? "light" : "subtle"}>
                  Profile
                </Button>
                <Button onClick={handleLogout} color="red" variant="subtle">
                  Log Out
                </Button>
              </>
            )}
          </Group>
        </Group>
      </Container>
    </header>
  );
};
