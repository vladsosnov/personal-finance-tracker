"use client";

import { useMemo } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

if (typeof window !== "undefined") {
  require("highcharts/modules/accessibility");
}
import { useComputedColorScheme } from "@mantine/core";
import type { Options } from "highcharts";
import type { GoalOperation } from "@/features/dashboard/types";
import { dateStringToUtcTimestamp } from "@/shared/utils/date";

type GoalChartProps = {
  operations: GoalOperation[];
  color: string;
  height?: number;
  range: "all" | "7d" | "1m" | "6m" | "12m";
};

const DAY_MS = 24 * 60 * 60 * 1000;

export const GoalChart = ({ operations, color, height = 320, range }: GoalChartProps) => {
  const computedColorScheme = useComputedColorScheme("light", { getInitialValueInEffect: true });
  const isDark = computedColorScheme === "dark";
  const seriesData = useMemo<Array<[number, number]>>(() => {
    let total = 0;
    const sortedOperations = [...operations]
      .sort((a, b) => {
        const dateComparison = a.operationDate.localeCompare(b.operationDate);
        return dateComparison !== 0 ? dateComparison : a.createdAt.localeCompare(b.createdAt);
      });

    const allData = sortedOperations
      .map((operation): [number, number] => {
        total += operation.type === "INCREASE" ? operation.amount : -operation.amount;
        return [dateStringToUtcTimestamp(operation.operationDate), Number(total.toFixed(2))];
      });

    if (range === "all" || !allData.length) {
      return allData;
    }

    const lastTimestamp = allData[allData.length - 1][0];
    const rangeStart = (() => {
      switch (range) {
        case "7d":
          return lastTimestamp - 7 * DAY_MS;
        case "1m":
          return lastTimestamp - 30 * DAY_MS;
        case "6m":
          return lastTimestamp - 183 * DAY_MS;
        case "12m":
          return lastTimestamp - 365 * DAY_MS;
        default:
          return 0;
      }
    })();

    const firstVisibleIndex = allData.findIndex(([timestamp]) => timestamp >= rangeStart);
    if (firstVisibleIndex <= 0) {
      return allData;
    }

    return [allData[firstVisibleIndex - 1], ...allData.slice(firstVisibleIndex)];
  }, [operations, range]);

  const options = useMemo<Options>(
    () => ({
      title: {
        text: "Progress over time",
        style: {
          color: isDark ? "#E5E7EB" : "#0F172A",
          fontWeight: "600",
        },
      },
      xAxis: {
        type: "datetime",
        lineColor: isDark ? "rgba(148, 163, 184, 0.3)" : "rgba(15, 23, 42, 0.18)",
        tickColor: isDark ? "rgba(148, 163, 184, 0.3)" : "rgba(15, 23, 42, 0.18)",
        labels: {
          style: {
            color: isDark ? "#94A3B8" : "#475569",
          },
        },
      },
      yAxis: {
        title: {
          text: "Current amount",
          style: {
            color: isDark ? "#94A3B8" : "#475569",
          },
        },
        gridLineColor: isDark ? "rgba(148, 163, 184, 0.16)" : "rgba(15, 23, 42, 0.08)",
        labels: {
          style: {
            color: isDark ? "#94A3B8" : "#475569",
          },
        },
      },
      series: [
        {
          type: "line",
          name: "Amount",
          data: seriesData,
          color,
        },
      ],
      legend: {
        itemStyle: {
          color: isDark ? "#E5E7EB" : "#0F172A",
        },
        itemHoverStyle: {
          color: isDark ? "#FFFFFF" : "#020617",
        },
      },
      tooltip: {
        backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
        borderColor: isDark ? "rgba(148, 163, 184, 0.25)" : "rgba(15, 23, 42, 0.12)",
        style: {
          color: isDark ? "#E5E7EB" : "#0F172A",
        },
      },
      accessibility: {
        description: "Line chart showing goal progress over time",
      },
      credits: { enabled: false },
      chart: {
        height,
        backgroundColor: "transparent",
        style: {
          fontFamily: "inherit",
        },
      },
    }),
    [color, height, isDark, seriesData]
  );

  return <HighchartsReact highcharts={Highcharts} options={options} />;
};
