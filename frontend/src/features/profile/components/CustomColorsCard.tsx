import { useState } from "react";
import {
  ActionIcon,
  Button,
  Card,
  ColorInput,
  ColorSwatch,
  Group,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { IconPlus, IconX } from "@tabler/icons-react";
import { useCustomColors } from "@/features/profile/hooks/useCustomColors";

export const CustomColorsCard = () => {
  const { colors, addColor, removeColor, maxColors } = useCustomColors();
  const [hex, setHex] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");

  const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(hex);
  const isDuplicate = colors.some((c) => c.value.toUpperCase() === hex.toUpperCase());
  const isAtLimit = colors.length >= maxColors;

  const handleAdd = () => {
    if (!isValidHex) {
      setError("Enter a valid hex color (e.g. #FF5500)");
      return;
    }
    if (isDuplicate) {
      setError("This color is already in your palette");
      return;
    }
    if (isAtLimit) {
      setError(`Maximum ${maxColors} custom colors`);
      return;
    }

    addColor(hex, label);
    setHex("");
    setLabel("");
    setError("");
  };

  return (
    <Card withBorder radius="md" p="lg">
      <Stack gap="md">
        <Stack gap={4}>
          <Title order={4}>Custom color palette</Title>
          <Text size="sm" c="dimmed">
            Add your own colors to use when creating goals.
          </Text>
        </Stack>

        {colors.length > 0 && (
          <Group gap="xs" wrap="wrap">
            {colors.map((color) => (
              <Tooltip key={color.value} label={color.label} withArrow>
                <Group
                  gap={4}
                  wrap="nowrap"
                  style={{
                    border: "1px solid var(--mantine-color-default-border)",
                    borderRadius: "var(--mantine-radius-xl)",
                    padding: "4px 8px 4px 4px",
                  }}
                >
                  <ColorSwatch color={color.value} size={20} />
                  <Text size="xs" truncate style={{ maxWidth: 80 }}>
                    {color.label}
                  </Text>
                  <ActionIcon
                    size="xs"
                    variant="subtle"
                    color="gray"
                    aria-label={`Remove ${color.label}`}
                    onClick={() => removeColor(color.value)}
                  >
                    <IconX size={12} />
                  </ActionIcon>
                </Group>
              </Tooltip>
            ))}
          </Group>
        )}

        <Group gap="xs" align="flex-start" wrap="nowrap">
          <ColorInput
            value={hex}
            onChange={(value) => {
              setHex(value);
              setError("");
            }}
            placeholder="#FF5500"
            format="hex"
            size="sm"
            error={error || undefined}
            style={{ flex: 1 }}
          />
          <TextInput
            value={label}
            onChange={(e) => setLabel(e.currentTarget.value)}
            placeholder="Color name"
            size="sm"
            maxLength={30}
            style={{ flex: 1 }}
          />
          <Button
            leftSection={<IconPlus size={16} />}
            size="sm"
            variant="light"
            onClick={handleAdd}
            disabled={isAtLimit}
          >
            Add
          </Button>
        </Group>

        {isAtLimit && (
          <Text size="xs" c="dimmed">
            Maximum of {maxColors} custom colors reached.
          </Text>
        )}
      </Stack>
    </Card>
  );
};
