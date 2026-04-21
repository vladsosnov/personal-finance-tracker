"use client";

import { useEffect, useRef, useState } from "react";
import { ActionIcon, Card, Grid, Group, RingProgress, Skeleton, Stack, Text, Title, Tooltip } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { IconInfoCircle } from "@tabler/icons-react";
import { formatMoney, getProgressPercentage } from "@/shared/utils/number";
import styles from "@/shared/styles/page-animations.module.css";

type DashboardOverviewStatsProps = {
  totalTarget: number | null;
  totalCurrent: number | null;
  currency: string;
};

const totalCurrentTooltip = "Zero-goal amounts are not included in Total current.";
const totalCurrentInfoLabel = "Why zero-goal amounts are excluded from Total current";

type TotalCurrentLabelProps = {
  id: string;
  size: "xs" | "sm";
};

const TotalCurrentLabel = ({ id, size }: TotalCurrentLabelProps) => (
  <Group gap={4} wrap="nowrap" align="center">
    <Text c="dimmed" size={size} id={id}>
      Total current
    </Text>
    <Tooltip label={totalCurrentTooltip} withArrow withinPortal={false}>
      <ActionIcon
        variant="transparent"
        color="gray"
        size="xs"
        aria-label={totalCurrentInfoLabel}
        aria-description={totalCurrentTooltip}
      >
        <IconInfoCircle size={14} stroke={1.8} />
      </ActionIcon>
    </Tooltip>
  </Group>
);

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

export const DashboardOverviewStats = ({ totalTarget, totalCurrent, currency }: DashboardOverviewStatsProps) => {
  const isLoading = totalTarget === null || totalCurrent === null;
  const animatedTarget = useDashboardCounter(totalTarget ?? 0);
  const animatedCurrent = useDashboardCounter(totalCurrent ?? 0);
  const progress = getProgressPercentage(totalCurrent ?? 0, totalTarget ?? 0);
  const animatedProgress = useDashboardCounter(Math.round(progress * 10) / 10, 900);
  const isMobile = useMediaQuery("(max-width: 768px)", false);

  if (isMobile) {
    return (
      <Stack gap="xs" role="region" aria-label="Dashboard overview">
        <div className={styles.stagger1}>
          <Card withBorder radius="md" p="md">
            <Stack gap="sm">
              <Group
                justify="space-between"
                align="flex-start"
                wrap="nowrap"
                data-testid="dashboard-overview-mobile-totals-row"
              >
                <div>
                  <Text c="dimmed" size="xs" id="stat-target-label-m">Total target</Text>
                  {isLoading ? <Skeleton height={24} width="70%" mt={2} /> : (
                    <Title order={4} aria-labelledby="stat-target-label-m" aria-live="polite">
                      {formatMoney(animatedTarget, currency)}
                    </Title>
                  )}
                </div>
                <div>
                  <TotalCurrentLabel id="stat-current-label-m" size="xs" />
                  {isLoading ? <Skeleton height={24} width={80} mt={2} /> : (
                    <Title order={4} aria-labelledby="stat-current-label-m" aria-live="polite">
                      {formatMoney(animatedCurrent, currency)}
                    </Title>
                  )}
                </div>
              </Group>
              <Group
                gap={8}
                wrap="nowrap"
                align="center"
                justify="center"
                data-testid="dashboard-overview-mobile-progress-row"
              >
                {!isLoading && (
                  <RingProgress
                    size={42}
                    thickness={5}
                    roundCaps
                    aria-hidden="true"
                    sections={[{ value: Math.min(progress, 100), color: "#316263" }]}
                  />
                )}
                <div>
                  <Text c="dimmed" size="xs" id="stat-progress-label-m">Progress</Text>
                  {isLoading ? <Skeleton height={24} width={50} mt={2} /> : (
                    <Title order={4} aria-labelledby="stat-progress-label-m" aria-live="polite">
                      {`${animatedProgress.toFixed(1)}%`}
                    </Title>
                  )}
                </div>
              </Group>
            </Stack>
          </Card>
        </div>
      </Stack>
    );
  }

  return (
    <Grid role="region" aria-label="Dashboard overview">
      <Grid.Col span={{ base: 12, md: 4 }}>
        <div className={styles.stagger1}>
          <Card withBorder radius="md" p="lg">
            <Text c="dimmed" size="sm" id="stat-target-label">Total target</Text>
            {isLoading ? <Skeleton height={28} width="60%" mt={4} /> : (
              <Title order={3} aria-labelledby="stat-target-label" aria-live="polite">
                {formatMoney(animatedTarget, currency)}
              </Title>
            )}
          </Card>
        </div>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <div className={styles.stagger2}>
          <Card withBorder radius="md" p="lg">
            <TotalCurrentLabel id="stat-current-label" size="sm" />
            {isLoading ? <Skeleton height={28} width="60%" mt={4} /> : (
              <Title order={3} aria-labelledby="stat-current-label" aria-live="polite">
                {formatMoney(animatedCurrent, currency)}
              </Title>
            )}
          </Card>
        </div>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <div className={styles.stagger3}>
          <Card withBorder radius="md" p="lg">
            <Group justify="space-between" align="center" wrap="nowrap">
              <div>
                <Text c="dimmed" size="sm" id="stat-progress-label">Overall progress</Text>
                {isLoading ? <Skeleton height={28} width={80} mt={4} /> : (
                  <Title order={3} aria-labelledby="stat-progress-label" aria-live="polite">
                    {`${animatedProgress.toFixed(1)}%`}
                  </Title>
                )}
              </div>
              {!isLoading && (
                <RingProgress
                  size={50}
                  thickness={6}
                  roundCaps
                  aria-hidden="true"
                  sections={[{ value: Math.min(progress, 100), color: "#316263" }]}
                />
              )}
            </Group>
          </Card>
        </div>
      </Grid.Col>
    </Grid>
  );
};
