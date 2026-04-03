import { Button, Drawer, Group, Stack } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { GoalDetailsPanel } from "@/features/dashboard/components/goal-details-panel";
import type { GoalDetailsPanelProps } from "@/features/dashboard/components/goal-details-panel";

type GoalDetailsDrawerProps = {
  opened: boolean;
  onClose: () => void;
  panelProps: GoalDetailsPanelProps;
};

export const GoalDetailsDrawer = ({ opened, onClose, panelProps }: GoalDetailsDrawerProps) => (
  <Drawer
    opened={opened}
    onClose={onClose}
    position="right"
    size="100%"
    withCloseButton={false}
    styles={{ body: { padding: 0, height: "100%" }, content: { display: "flex", flexDirection: "column" } }}
  >
    <Stack gap={0} style={{ height: "100%" }}>
      <Group px="md" py="sm" style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}>
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          onClick={onClose}
          px={8}
        >
          Goals
        </Button>
      </Group>
      <div style={{ flex: 1, overflow: "auto", padding: "var(--mantine-spacing-md)" }}>
        <GoalDetailsPanel {...panelProps} scrollHeight={undefined} />
      </div>
    </Stack>
  </Drawer>
);
