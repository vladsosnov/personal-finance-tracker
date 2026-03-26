"use client";

import { useEffect, useRef, useState } from "react";
import { useIntersection } from "@mantine/hooks";
import { Title } from "@mantine/core";
import styles from "@/features/landing/styles/landing.module.css";

type AnimatedCounterProps = {
  target: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  order?: 1 | 2 | 3 | 4 | 5 | 6;
};

export const AnimatedCounter = ({ target, prefix = "", suffix = "", duration = 1200, order = 3 }: AnimatedCounterProps) => {
  const [value, setValue] = useState(0);
  const hasAnimated = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { ref, entry } = useIntersection({ root: rootRef.current, threshold: 0.5 });

  useEffect(() => {
    if (!entry?.isIntersecting || hasAnimated.current) return;
    hasAnimated.current = true;

    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [entry?.isIntersecting, target, duration]);

  return (
    <div ref={ref}>
      <Title order={order} className={styles.animatedNumber}>
        {prefix}{value.toLocaleString()}{suffix}
      </Title>
    </div>
  );
};
