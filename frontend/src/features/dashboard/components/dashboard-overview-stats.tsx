import { Card, Grid, Text, Title } from "@mantine/core";
import { formatMoney, getProgressPercentage } from "@/shared/utils/number";
import styles from "@/shared/styles/page-animations.module.css";

type DashboardOverviewStatsProps = {
  totalTarget: number;
  totalCurrent: number;
};

export const DashboardOverviewStats = ({ totalTarget, totalCurrent }: DashboardOverviewStatsProps) => {
  return (
    <Grid role="region" aria-label="Dashboard overview">
      <Grid.Col span={{ base: 12, md: 4 }}>
        <div className={styles.stagger1}>
          <Card withBorder radius="md" p="lg" className={styles.statCard}>
            <Text c="dimmed" size="sm" id="stat-target-label">
              Total target
            </Text>
            <Title order={3} aria-labelledby="stat-target-label" aria-live="polite">{formatMoney(totalTarget)}</Title>
          </Card>
        </div>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <div className={styles.stagger2}>
          <Card withBorder radius="md" p="lg" className={styles.statCard}>
            <Text c="dimmed" size="sm" id="stat-current-label">
              Total current
            </Text>
            <Title order={3} aria-labelledby="stat-current-label" aria-live="polite">{formatMoney(totalCurrent)}</Title>
          </Card>
        </div>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <div className={styles.stagger3}>
          <Card withBorder radius="md" p="lg" className={styles.statCard}>
            <Text c="dimmed" size="sm" id="stat-progress-label">
              Overall progress
            </Text>
            <Title order={3} aria-labelledby="stat-progress-label" aria-live="polite">{`${getProgressPercentage(totalCurrent, totalTarget).toFixed(1)}%`}</Title>
          </Card>
        </div>
      </Grid.Col>
    </Grid>
  );
};
