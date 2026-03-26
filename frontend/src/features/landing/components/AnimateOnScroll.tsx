"use client";

import { useRef, type ReactNode, type CSSProperties } from "react";
import { useIntersection } from "@mantine/hooks";
import styles from "@/features/landing/styles/landing.module.css";

type AnimateOnScrollProps = {
  children: ReactNode;
  delay?: number;
  variant?: "up" | "scale";
  className?: string;
  style?: CSSProperties;
};

export const AnimateOnScroll = ({ children, delay = 0, variant = "up", className = "", style }: AnimateOnScrollProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const { ref, entry } = useIntersection({ root: rootRef.current, threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
  const isVisible = entry?.isIntersecting;

  const baseClass = variant === "scale" ? styles.revealScale : styles.reveal;

  return (
    <div
      ref={ref}
      className={`${baseClass} ${isVisible ? styles.revealVisible : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms`, ...style }}
    >
      {children}
    </div>
  );
};
