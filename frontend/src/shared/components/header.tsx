"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApolloClient, useQuery } from "@apollo/client/react";
import { IconDownload } from "@tabler/icons-react";
import { Badge, Box, Burger, Button, Container, Drawer, Group, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { GET_ME, type MeQueryData } from "@/shared/gql/queries";
import { API_BASE_URL } from "@/shared/constants/auth";
import { APP_ROUTES } from "@/shared/constants/routes";
import { usePwaInstall } from "@/shared/hooks/usePwaInstall";
import { tokenStorage } from "@/shared/lib/token-storage";
import anim from "@/shared/styles/page-animations.module.css";

export const Header = () => {
  const apolloClient = useApolloClient();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpened, { toggle: toggleMenu, close: closeMenu }] = useDisclosure(false);
  const { canInstall, install } = usePwaInstall();
  const { data: meData } = useQuery<MeQueryData>(GET_ME, {
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
      tokenStorage.clear();
      apolloClient.writeQuery({ query: GET_ME, data: { me: null } });
      await apolloClient.clearStore();
      router.push(APP_ROUTES.home);
    }
  };

  const publicLinks: ReadonlyArray<{ href: string; label: string; exact?: boolean }> = [
    { href: APP_ROUTES.home, label: "Home", exact: true },
    { href: APP_ROUTES.dashboard, label: "Goals" },
    { href: APP_ROUTES.expenses, label: "Expenses" },
    { href: APP_ROUTES.feedback, label: "Feedback" },
  ];

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const navLinks = (
    <>
      {publicLinks.map(({ href, label, exact }) => (
        <Button
          key={href}
          component={Link}
          href={href}
          variant={isActive(href, exact) ? "light" : "subtle"}
          aria-current={isActive(href, exact) ? "page" : undefined}
          onClick={closeMenu}
        >
          {label}
        </Button>
      ))}
      {isAuthed && (
        <>
          {isAdmin && (
            <Button
              component={Link}
              href={APP_ROUTES.adminLogs}
              variant={isActive(APP_ROUTES.adminLogs) ? "light" : "subtle"}
              aria-current={isActive(APP_ROUTES.adminLogs) ? "page" : undefined}
              color="red"
              onClick={closeMenu}
            >
              Admin Logs
            </Button>
          )}
          <Button
            component={Link}
            href={APP_ROUTES.profile}
            variant={isActive(APP_ROUTES.profile) ? "light" : "subtle"}
            aria-current={isActive(APP_ROUTES.profile) ? "page" : undefined}
            onClick={closeMenu}
            rightSection={showSubBadge ? (
              <Badge size="xs" variant="light" color={subscription === "Lifetime" ? "teal" : "blue"} px={5} style={{ cursor: "pointer" }}>
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
        <nav aria-label="Mobile navigation" className="mobile-nav">
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
