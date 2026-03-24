import { IconPointFilled } from "@tabler/icons-react";
import { ThemeIcon } from "@mantine/core";

export const ListBullet = (
  <ThemeIcon size={20} radius="xl" variant="light" styles={{ root: { display: "flex", alignItems: "center", justifyContent: "center" } }}>
    <IconPointFilled size={10} stroke={0} />
  </ThemeIcon>
);
