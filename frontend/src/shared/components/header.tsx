"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApolloClient, useQuery } from "@apollo/client/react";
import { Box, Burger, Button, Container, Drawer, Group, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { GET_ME } from "@/shared/gql/queries";
import { API_BASE_URL } from "@/shared/constants/auth";
import { APP_ROUTES } from "@/shared/constants/routes";

export const Header = () => {
  const apolloClient = useApolloClient();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpened, { toggle: toggleMenu, close: closeMenu }] = useDisclosure(false);
  const { data: meData } = useQuery<{ me: { id: string; role: string } | null }>(GET_ME, {
    fetchPolicy: "cache-and-network",
  });
  const isAuthed = Boolean(meData?.me);
  const isAdmin = meData?.me?.role === "admin";

  const handleLogout = async () => {
    closeMenu();
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      await apolloClient.resetStore();
      router.push(APP_ROUTES.home);
    }
  };

  const navLinks = (
    <>
      <Button
        component={Link}
        href={APP_ROUTES.home}
        variant={pathname === APP_ROUTES.home ? "light" : "subtle"}
        aria-current={pathname === APP_ROUTES.home ? "page" : undefined}
        onClick={closeMenu}
      >
        Home
      </Button>
      <Button
        component={Link}
        href={APP_ROUTES.dashboard}
        variant={pathname === APP_ROUTES.dashboard ? "light" : "subtle"}
        aria-current={pathname === APP_ROUTES.dashboard ? "page" : undefined}
        onClick={closeMenu}
      >
        Dashboard
      </Button>
      <Button
        component={Link}
        href={APP_ROUTES.feedback}
        variant={pathname === APP_ROUTES.feedback ? "light" : "subtle"}
        aria-current={pathname === APP_ROUTES.feedback ? "page" : undefined}
        onClick={closeMenu}
      >
        Feedback
      </Button>
      {isAuthed && (
        <>
          {isAdmin && (
            <Button
              component={Link}
              href={APP_ROUTES.adminLogs}
              variant={pathname === APP_ROUTES.adminLogs ? "light" : "subtle"}
              aria-current={pathname === APP_ROUTES.adminLogs ? "page" : undefined}
              color="red"
              onClick={closeMenu}
            >
              Admin Logs
            </Button>
          )}
          <Button
            component={Link}
            href={APP_ROUTES.profile}
            variant={pathname === APP_ROUTES.profile ? "light" : "subtle"}
            aria-current={pathname === APP_ROUTES.profile ? "page" : undefined}
            onClick={closeMenu}
          >
            Profile
          </Button>
          <Button onClick={handleLogout} color="red" variant="subtle">
            Log Out
          </Button>
        </>
      )}
    </>
  );

  return (
    <header className="app-header">
      <Container size="xl" py="sm">
        <Group justify="space-between">
          <Text fw={800}>Financial Goals Tracker</Text>

          {/* Desktop nav */}
          <Box visibleFrom="sm">
            <nav aria-label="Main navigation">
              <Group gap="xs">{navLinks}</Group>
            </nav>
          </Box>

          {/* Mobile burger */}
          <Burger
            opened={menuOpened}
            onClick={toggleMenu}
            aria-label="Toggle navigation menu"
            hiddenFrom="sm"
            size="sm"
          />
        </Group>
      </Container>

      {/* Mobile drawer */}
      <Drawer
        opened={menuOpened}
        onClose={closeMenu}
        title="Navigation"
        position="right"
        size="xs"
        hiddenFrom="sm"
      >
        <nav aria-label="Mobile navigation">
          <Stack gap="xs">{navLinks}</Stack>
        </nav>
      </Drawer>
    </header>
  );
};
