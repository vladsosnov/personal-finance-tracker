import { IconDeviceDesktop, IconMoon, IconSun } from "@tabler/icons-react";
import { Button, Card, Group, Stack, Title, useMantineColorScheme } from "@mantine/core";
import type { MantineColorScheme } from "@mantine/core";

const THEME_OPTIONS = [
  { value: "auto", label: "System", Icon: IconDeviceDesktop },
  { value: "light", label: "Light", Icon: IconSun },
  { value: "dark", label: "Dark", Icon: IconMoon },
] as const;

export const ThemeCard = () => {
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  return (
    <Card withBorder radius="md" p="lg">
      <Stack gap="md">
        <Title order={4} id="theme-heading">Theme</Title>
        <Group gap="xs" grow role="group" aria-labelledby="theme-heading">
          {THEME_OPTIONS.map(({ value, label, Icon }) => (
            <Button
              key={value}
              fullWidth
              variant={colorScheme === value ? "light" : "default"}
              leftSection={<Icon size={16} stroke={2} aria-hidden="true" />}
              aria-pressed={colorScheme === value}
              onClick={() => setColorScheme(value as MantineColorScheme)}
            >
              {label}
            </Button>
          ))}
        </Group>
      </Stack>
    </Card>
  );
};
