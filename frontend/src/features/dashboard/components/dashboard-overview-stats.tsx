import { Card, Grid, Text, Title } from "@mantine/core";
import { formatMoney, getProgressPercentage } from "@/shared/utils/number";

type DashboardOverviewStatsProps = {
  totalTarget: number;
  totalCurrent: number;
};

export const DashboardOverviewStats = ({ totalTarget, totalCurrent }: DashboardOverviewStatsProps) => {
  return (
    <Grid>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Card withBorder radius="md" p="lg">
          <Text c="dimmed" size="sm">
            Total target
          </Text>
          <Title order={3}>{formatMoney(totalTarget)}</Title>
        </Card>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Card withBorder radius="md" p="lg">
          <Text c="dimmed" size="sm">
            Total current
          </Text>
          <Title order={3}>{formatMoney(totalCurrent)}</Title>
        </Card>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Card withBorder radius="md" p="lg">
          <Text c="dimmed" size="sm">
            Overall progress
          </Text>
          <Title order={3}>{`${getProgressPercentage(totalCurrent, totalTarget).toFixed(1)}%`}</Title>
        </Card>
      </Grid.Col>
    </Grid>
  );
};
