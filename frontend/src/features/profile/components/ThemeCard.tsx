import { IconDeviceDesktop, IconMoon, IconSun } from "@tabler/icons-react";
import { Card, SegmentedControl, Stack, Text, ThemeIcon, Title, useMantineColorScheme } from "@mantine/core";
import type { MantineColorScheme } from "@mantine/core";

const labelStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  whiteSpace: "nowrap" as const,
};

const iconStyle = { display: "flex", alignItems: "center", justifyContent: "center" };

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
        <Title order={4}>Theme</Title>
        <SegmentedControl
          value={colorScheme}
          onChange={(value) => setColorScheme(value as MantineColorScheme)}
          aria-label="Theme preference"
          data={THEME_OPTIONS.map(({ value, label, Icon }) => ({
            value,
            label: (
              <span style={labelStyle}>
                <ThemeIcon size="sm" variant="transparent" style={iconStyle} aria-hidden="true">
                  <Icon size={16} stroke={2} />
                </ThemeIcon>
                <span>{label}</span>
              </span>
            ),
          }))}
        />
      </Stack>
    </Card>
  );
};
