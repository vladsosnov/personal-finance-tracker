import Link from "next/link";
import { Anchor, Container, Group, Stack, Text } from "@mantine/core";
import { APP_ROUTES } from "@/shared/constants/routes";
import anim from "@/shared/styles/page-animations.module.css";

const footerLinks = [
  { href: APP_ROUTES.home, label: "Home" },
  { href: APP_ROUTES.dashboard, label: "Goals" },
  { href: APP_ROUTES.expenses, label: "Expenses" },
  { href: APP_ROUTES.feedback, label: "Feedback" },
] as const;

export const Footer = () => {
  return (
    <footer className="app-footer">
      <Container size="xl" py="lg">
        <Stack gap="sm">
          <Group justify="space-between" align="center" wrap="wrap">
            <Text fw={700} size="sm" className={anim.headerBrand}>
              Financial Goals Tracker
            </Text>
            <Group gap="md" component="nav" aria-label="Footer navigation">
              {footerLinks.map(({ href, label }) => (
                <Anchor key={href} component={Link} href={href} size="sm" c="dimmed" underline="hover">
                  {label}
                </Anchor>
              ))}
            </Group>
          </Group>
          <Text size="xs" c="dimmed">
            Build goals, update progress, stay accountable.
          </Text>
        </Stack>
      </Container>
    </footer>
  );
};
