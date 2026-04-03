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
  targetAmount: number;
  initialAmount: number;
  currentAmount: number;
  isCompleted: boolean;
  height?: number;
  range: "all" | "7d" | "1m" | "6m" | "12m";
  showTrend?: boolean;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_PREDICTION_DAYS = 365 * 5;

type TrendResult = {
  points: Array<[number, number]>;
  predictedDate: string | null;
};

const buildTrendLine = (
  seriesData: Array<[number, number]>,
  currentAmount: number,
  targetAmount: number,
  isCompleted: boolean,
): TrendResult => {
  if (isCompleted || seriesData.length < 2) return { points: [], predictedDate: null };

  // Linear regression: y = slope * x + intercept
  const n = seriesData.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  // Use first timestamp as origin to avoid floating point issues with large timestamps
  const origin = seriesData[0][0];

  for (const [x, y] of seriesData) {
    const xNorm = x - origin;
    sumX += xNorm;
    sumY += y;
    sumXY += xNorm * y;
    sumXX += xNorm * xNorm;
  }

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return { points: [], predictedDate: null };

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // Trend line must be going up to project a goal completion
  if (slope <= 0) {
    // Still show the trend through existing data even if negative
    const startX = seriesData[0][0];
    const endX = seriesData[seriesData.length - 1][0];
    return {
      points: [
        [startX, Number(intercept.toFixed(2))],
        [endX, Number((slope * (endX - origin) + intercept).toFixed(2))],
      ],
      predictedDate: null,
    };
  }

  const startX = seriesData[0][0];
  const startY = Number(intercept.toFixed(2));
  const lastX = seriesData[seriesData.length - 1][0];
  const lastY = Number((slope * (lastX - origin) + intercept).toFixed(2));

  const points: Array<[number, number]> = [
    [startX, startY],
    [lastX, lastY],
  ];

  let predictedDate: string | null = null;

  // Extend to target if applicable
  if (targetAmount > 0 && currentAmount < targetAmount) {
    const daysToTarget = (targetAmount - intercept) / slope;
    const targetTimestamp = origin + daysToTarget;
    const projectionDays = (targetTimestamp - lastX) / DAY_MS;

    if (projectionDays > 0 && projectionDays <= MAX_PREDICTION_DAYS) {
      points.push([targetTimestamp, targetAmount]);
      predictedDate = new Date(targetTimestamp).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  }

  return { points, predictedDate };
};

export const GoalChart = ({
  operations,
  color,
  targetAmount,
  initialAmount,
  currentAmount,
  isCompleted,
  height = 320,
  range,
  showTrend = false,
}: GoalChartProps) => {
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

  const trendResult = useMemo(
    () => buildTrendLine(seriesData, currentAmount, targetAmount, isCompleted),
    [seriesData, currentAmount, targetAmount, isCompleted]
  );

  const series: Options["series"] = [
    {
      type: "line",
      name: "Amount",
      data: seriesData,
      color,
    },
  ];

  if (showTrend && trendResult.points.length > 0) {
    const predictionLabel = trendResult.predictedDate
      ? `Predicted completion: ${trendResult.predictedDate}`
      : "Trend line";

    series.push({
      type: "line",
      name: "Trend",
      data: trendResult.points,
      color: isDark ? "#94A3B8" : "#9CA3AF",
      dashStyle: "Dash",
      lineWidth: 1.5,
      marker: {
        enabled: false,
      },
      showInLegend: false,
      enableMouseTracking: true,
      tooltip: {
        headerFormat: "",
        pointFormat: `<span style="font-size: 12px">${predictionLabel}</span>`,
      },
    });
  }

  const options = useMemo<Options>(
    () => ({
      title: {
        text: "Progress over time",
        style: {
          color: isDark ? "#E7D8C6" : "#101417",
          fontWeight: "600",
        },
      },
      xAxis: {
        type: "datetime",
        lineColor: isDark ? "rgba(62, 92, 71, 0.35)" : "rgba(16, 20, 23, 0.18)",
        tickColor: isDark ? "rgba(62, 92, 71, 0.35)" : "rgba(16, 20, 23, 0.18)",
        labels: {
          style: {
            color: isDark ? "#9a8e80" : "#475569",
          },
        },
      },
      yAxis: {
        title: {
          text: "Current amount",
          style: {
            color: isDark ? "#9a8e80" : "#475569",
          },
        },
        gridLineColor: isDark ? "rgba(62, 92, 71, 0.2)" : "rgba(16, 20, 23, 0.08)",
        labels: {
          style: {
            color: isDark ? "#9a8e80" : "#475569",
          },
        },
        plotLines: targetAmount > 0 ? [{
          value: targetAmount,
          color: isDark ? "rgba(34, 197, 94, 0.5)" : "rgba(22, 163, 74, 0.5)",
          width: 1,
          dashStyle: "Dot",
        }] : [],
      },
      series,
      legend: {
        itemStyle: {
          color: isDark ? "#E7D8C6" : "#101417",
        },
        itemHoverStyle: {
          color: isDark ? "#FFFFFF" : "#020617",
        },
      },
      tooltip: {
        backgroundColor: isDark ? "#171C21" : "#FFFFFF",
        borderColor: isDark ? "rgba(62, 92, 71, 0.35)" : "rgba(16, 20, 23, 0.12)",
        style: {
          color: isDark ? "#E7D8C6" : "#101417",
        },
      },
      accessibility: {
        description: "Line chart showing goal progress over time with prediction line",
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
    [color, height, isDark, seriesData, trendResult, targetAmount, series]
  );

  return <HighchartsReact highcharts={Highcharts} options={options} />;
};
