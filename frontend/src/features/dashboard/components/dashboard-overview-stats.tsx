"use client";

import { useEffect, useRef, useState } from "react";
import { Card, Grid, Group, RingProgress, Text, Title } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
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
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [activeSlide, setActiveSlide] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const cards = [
    <Card key="target" withBorder radius="md" p="lg">
      <Text c="dimmed" size="sm" id="stat-target-label">Total target</Text>
      <Title order={3} aria-labelledby="stat-target-label" aria-live="polite">
        {formatMoney(animatedTarget)}
      </Title>
    </Card>,
    <Card key="current" withBorder radius="md" p="lg">
      <Text c="dimmed" size="sm" id="stat-current-label">Total current</Text>
      <Title order={3} aria-labelledby="stat-current-label" aria-live="polite">
        {formatMoney(animatedCurrent)}
      </Title>
    </Card>,
    <Card key="progress" withBorder radius="md" p="lg">
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
    </Card>,
  ];

  if (isMobile) {
    return (
      <div
        role="region"
        aria-label="Dashboard overview"
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const diff = touchStartX.current - e.changedTouches[0].clientX;
          if (diff > 40) setActiveSlide((s) => (s + 1) % cards.length);
          else if (diff < -40) setActiveSlide((s) => (s - 1 + cards.length) % cards.length);
          touchStartX.current = null;
        }}
      >
        <div className={styles.stagger1}>
          {cards[activeSlide]}
        </div>
        <Group justify="center" gap={6} mt={8}>
          {cards.map((_, i) => (
            <div
              key={i}
              onClick={() => setActiveSlide(i)}
              style={{
                width: i === activeSlide ? 16 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === activeSlide ? "#316263" : "var(--mantine-color-default-border)",
                cursor: "pointer",
                transition: "width 0.2s ease",
              }}
            />
          ))}
        </Group>
      </div>
    );
  }

  return (
    <Grid role="region" aria-label="Dashboard overview">
      <Grid.Col span={{ base: 12, md: 4 }}>
        <div className={styles.stagger1}>{cards[0]}</div>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <div className={styles.stagger2}>{cards[1]}</div>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <div className={styles.stagger3}>{cards[2]}</div>
      </Grid.Col>
    </Grid>
  );
};
