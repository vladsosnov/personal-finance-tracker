"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApolloClient, useQuery } from "@apollo/client/react";
import { IconDownload } from "@tabler/icons-react";
import { Badge, Box, Burger, Button, Container, Drawer, Group, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { GET_ME } from "@/shared/gql/queries";
import { API_BASE_URL } from "@/shared/constants/auth";
import { APP_ROUTES } from "@/shared/constants/routes";
import { usePwaInstall } from "@/shared/hooks/usePwaInstall";
import anim from "@/shared/styles/page-animations.module.css";

export const Header = () => {
  const apolloClient = useApolloClient();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpened, { toggle: toggleMenu, close: closeMenu }] = useDisclosure(false);
  const { canInstall, install } = usePwaInstall();
  const { data: meData } = useQuery<{ me: { id: string; role: string; subscription: string } | null }>(GET_ME, {
    fetchPolicy: "cache-and-network",
  });
  const isAuthed = Boolean(meData?.me);
  const isAdmin = meData?.me?.role === "admin";
  const subscription = meData?.me?.subscription ?? "Free";
  const showSubBadge = isAuthed && subscription.toLowerCase() !== "free";

  const handleLogout = async () => {
    closeMenu();
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      apolloClient.writeQuery({ query: GET_ME, data: { me: null } });
      await apolloClient.clearStore();
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
        variant={pathname.startsWith(APP_ROUTES.dashboard) ? "light" : "subtle"}
        aria-current={pathname.startsWith(APP_ROUTES.dashboard) ? "page" : undefined}
        onClick={closeMenu}
      >
        Goals
      </Button>
      <Button
        component={Link}
        href={APP_ROUTES.expenses}
        variant={pathname.startsWith(APP_ROUTES.expenses) ? "light" : "subtle"}
        aria-current={pathname.startsWith(APP_ROUTES.expenses) ? "page" : undefined}
        onClick={closeMenu}
      >
        Expenses
      </Button>
      <Button
        component={Link}
        href={APP_ROUTES.feedback}
        variant={pathname.startsWith(APP_ROUTES.feedback) ? "light" : "subtle"}
        aria-current={pathname.startsWith(APP_ROUTES.feedback) ? "page" : undefined}
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
              variant={pathname.startsWith(APP_ROUTES.adminLogs) ? "light" : "subtle"}
              aria-current={pathname.startsWith(APP_ROUTES.adminLogs) ? "page" : undefined}
              color="red"
              onClick={closeMenu}
            >
              Admin Logs
            </Button>
          )}
          <Button
            component={Link}
            href={APP_ROUTES.profile}
            variant={pathname.startsWith(APP_ROUTES.profile) ? "light" : "subtle"}
            aria-current={pathname.startsWith(APP_ROUTES.profile) ? "page" : undefined}
            onClick={closeMenu}
            rightSection={showSubBadge ? (
              <Badge size="xs" variant="light" color={subscription === "Lifetime" ? "teal" : "blue"} px={5}>
                {subscription}
              </Badge>
            ) : undefined}
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
          <Text fw={800} component={Link} href={APP_ROUTES.home} className={anim.headerBrand} style={{ fontSize: "1.1rem" }}>
            Financial Goals Tracker
          </Text>

          {/* Desktop nav */}
          <Box visibleFrom="sm">
            <Group gap="xs">
              <nav aria-label="Main navigation">
                <Group gap="xs">{navLinks}</Group>
              </nav>
              {canInstall && (
                <Button
                  variant="light"
                  size="sm"
                  leftSection={<IconDownload size={16} />}
                  onClick={install}
                  aria-label="Install app"
                >
                  Install App
                </Button>
              )}
            </Group>
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
          <Stack gap="xs">
            {navLinks}
            {canInstall && (
              <Button
                variant="light"
                leftSection={<IconDownload size={16} />}
                onClick={() => { closeMenu(); install(); }}
                aria-label="Install app"
              >
                Install App
              </Button>
            )}
          </Stack>
        </nav>
      </Drawer>
    </header>
  );
};
