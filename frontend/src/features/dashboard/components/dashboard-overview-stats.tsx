"use client";

import { useEffect, useRef, useState } from "react";
import { Card, Grid, Group, RingProgress, Text, Title } from "@mantine/core";
import { formatMoney, getProgressPercentage } from "@/shared/utils/number";
import styles from "@/shared/styles/page-animations.module.css";

type DashboardOverviewStatsProps = {
  totalTarget: number;
  totalCurrent: number;
};

const useDashboardCounter = (target: number, duration = 900) => {
  const [value, setValue] = useState(0);
  const prevTarget = useRef<number | null>(null);

  useEffect(() => {
    if (prevTarget.current === target) return;
    prevTarget.current = target;

    const startFrom = value;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(startFrom + Math.round(eased * (target - startFrom)));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return value;
};

export const DashboardOverviewStats = ({ totalTarget, totalCurrent }: DashboardOverviewStatsProps) => {
  const animatedTarget = useDashboardCounter(totalTarget);
  const animatedCurrent = useDashboardCounter(totalCurrent);
  const progress = getProgressPercentage(totalCurrent, totalTarget);
  const animatedProgress = useDashboardCounter(Math.round(progress * 10) / 10, 900);

  return (
    <Grid role="region" aria-label="Dashboard overview">
      <Grid.Col span={{ base: 12, md: 4 }}>
        <div className={styles.stagger1}>
          <Card withBorder radius="md" p="lg" className={styles.statCard}>
            <Text c="dimmed" size="sm" id="stat-target-label">Total target</Text>
            <Title order={3} aria-labelledby="stat-target-label" aria-live="polite">
              {formatMoney(animatedTarget)}
            </Title>
          </Card>
        </div>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <div className={styles.stagger2}>
          <Card withBorder radius="md" p="lg" className={styles.statCard}>
            <Text c="dimmed" size="sm" id="stat-current-label">Total current</Text>
            <Title order={3} aria-labelledby="stat-current-label" aria-live="polite">
              {formatMoney(animatedCurrent)}
            </Title>
          </Card>
        </div>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <div className={styles.stagger3}>
          <Card withBorder radius="md" p="lg" className={styles.statCard}>
            <Group justify="space-between" align="center" wrap="nowrap">
              <div>
                <Text c="dimmed" size="sm" id="stat-progress-label">Overall progress</Text>
                <Title order={3} aria-labelledby="stat-progress-label" aria-live="polite">
                  {`${animatedProgress.toFixed(1)}%`}
                </Title>
              </div>
              <RingProgress
                size={51}
                thickness={6}
                roundCaps
                aria-hidden="true"
                sections={[{ value: Math.min(progress, 100), color: "#316263" }]}
              />
            </Group>
          </Card>
        </div>
      </Grid.Col>
    </Grid>
  );
};
